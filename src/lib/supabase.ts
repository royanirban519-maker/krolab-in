import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// HYBRID DATA LAYER
// Uses Supabase when env keys are present, otherwise falls back
// to a rich localStorage-backed engine — zero crash guarantee.
// ─────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type AuthRole = 'free_brand' | 'pro_brand' | 'creator' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  venueName?: string;
  pincode?: string;
  phone?: string;
};

export type NewCreator = {
  id: string;
  name: string;
  category: string;
  platform: string;
  gender: string;
  pincode: string;
  area: string;
  followers: string;
  rate: string;
  rating: number;
  img: string;
  verified: boolean;
};

export type ShortlistEntry = {
  id: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
};

export type InviteEntry = {
  id: string;
  venueName: string;
  venuePincode: string;
  creatorId: string;
  creatorName: string;
  packageSelected: string;
  shootDate: string;
  budget: string;
  message: string;
  status: 'pending' | 'accepted' | 'completed';
  createdAt: string;
};

export type UpiLog = {
  id: string;
  brandName: string;
  brandPhone: string;
  planTier: string;
  amount: number;
  utrNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  brandId?: string;
};

export type BrandRow = {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  venueName?: string | null;
  pincode?: string | null;
  phone?: string | null;
  brandType?: string | null;
  address?: string | null;
  venueImages?: string[];
  proExpiresAt?: string | null;
  createdAt?: string;
};

export type BrandProfileInput = {
  brandName: string;
  phone: string;
  address: string;
  brandType: string;
  venueImages?: string[];
};

export type ActivityEntry = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  targetProfileId: string | null;
  targetName: string | null;
  activityType: string;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  adminId: string;
  action: 'approve_utr' | 'reject_utr' | 'upgrade_brand' | 'downgrade_brand';
  targetUserId?: string | null;
  targetTable?: string | null;
  targetId?: string | null;
  detail: Record<string, unknown>;
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────
// LOCAL STORAGE FALLBACK KEYS
// ─────────────────────────────────────────────────────────────

const LS = {
  user: 'krolab_user',
  creators: 'krolab_creators',
  shortlist: 'krolab_shortlist',
  invites: 'krolab_invites',
  upiLogs: 'krolab_upi_logs',
  auditLog: 'krolab_audit_log',
  activity: 'krolab_activity',
};

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

function lsSet<T>(key: string, val: T): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────

export const authService = {
  async signUp(email: string, password: string, fullName: string, role: AuthRole, extra?: { venueName?: string; pincode?: string; phone?: string }): Promise<AuthUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw new Error(error.message);
      const userId = data.user?.id ?? uid();
      // Insert profile
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        role,
        venue_name: extra?.venueName,
        pincode: extra?.pincode,
        phone: extra?.phone,
      });
      return { id: userId, email, fullName, role, venueName: extra?.venueName, pincode: extra?.pincode, phone: extra?.phone };
    }
    // localStorage fallback
    const user: AuthUser = { id: uid(), email, fullName, role, venueName: extra?.venueName, pincode: extra?.pincode, phone: extra?.phone };
    lsSet(LS.user, user);
    return user;
  },

  async signIn(email: string, password: string): Promise<AuthUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const userId = data.user?.id ?? uid();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      return {
        id: userId,
        email: data.user?.email ?? email,
        fullName: profile?.full_name ?? data.user?.user_metadata?.full_name ?? '',
        role: (profile?.role as AuthRole) ?? 'free_brand',
        venueName: profile?.venue_name,
        pincode: profile?.pincode,
        phone: profile?.phone,
      };
    }
    const stored = lsGet<AuthUser | null>(LS.user, null);
    if (stored && stored.email === email) return stored;
    // Demo: accept any email in fallback mode
    const user: AuthUser = { id: uid(), email, fullName: email.split('@')[0], role: 'free_brand' };
    lsSet(LS.user, user);
    return user;
  },

  async signOut(): Promise<void> {
    if (supabase) { await supabase.auth.signOut(); }
    try { localStorage.removeItem(LS.user); } catch { /* ignore */ }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;
      const userId = session.user.id;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      return {
        id: userId,
        email: session.user.email ?? '',
        fullName: profile?.full_name ?? session.user.user_metadata?.full_name ?? '',
        role: (profile?.role as AuthRole) ?? 'free_brand',
        venueName: profile?.venue_name,
        pincode: profile?.pincode,
        phone: profile?.phone,
      };
    }
    return lsGet<AuthUser | null>(LS.user, null);
  },
};

// ─────────────────────────────────────────────────────────────
// CREATOR PORTFOLIO SERVICE
// ─────────────────────────────────────────────────────────────

export const portfolioService = {
  async publishCreator(data: NewCreator): Promise<NewCreator> {
    if (supabase) {
      const { data: row, error } = await supabase.from('creator_portfolios').insert({
        user_id: (await authService.getCurrentUser())?.id,
        name: data.name,
        category: data.category,
        platform: data.platform,
        gender: data.gender,
        pincode: data.pincode,
        area: data.area,
        followers: data.followers,
        base_rate: data.rate,
        avatar_url: data.img,
        verified: false,
      }).select().single();
      if (error) throw new Error(error.message);
      return data; // return the original shape for UI consistency
    }
    const list = lsGet<NewCreator[]>(LS.creators, []);
    list.push(data);
    lsSet(LS.creators, list);
    return data;
  },

  async listCreators(): Promise<NewCreator[]> {
    if (supabase) {
      const { data, error } = await supabase.from('creator_portfolios').select('*').eq('verified', true);
      if (error) return [];
      return (data ?? []).map(r => ({
        id: r.id, name: r.name, category: r.category, platform: r.platform,
        gender: r.gender ?? 'male', pincode: r.pincode, area: r.area ?? '',
        followers: r.followers ?? '0', rate: r.base_rate, rating: 4.8,
        img: r.avatar_url ?? '', verified: r.verified,
      }));
    }
    return lsGet<NewCreator[]>(LS.creators, []);
  },
};

// ─────────────────────────────────────────────────────────────
// SHORTLIST SERVICE
// ─────────────────────────────────────────────────────────────

export const shortlistService = {
  async list(): Promise<ShortlistEntry[]> {
    if (supabase) {
      const { data, error } = await supabase.from('creator_shortlists').select('*').order('created_at', { ascending: false });
      if (error) return lsGet<ShortlistEntry[]>(LS.shortlist, []);
      return (data ?? []).map(r => ({ id: r.id, creatorId: r.creator_id, creatorName: r.creator_name, createdAt: r.created_at }));
    }
    return lsGet<ShortlistEntry[]>(LS.shortlist, []);
  },

  async toggle(creatorId: string, creatorName: string): Promise<void> {
    if (supabase) {
      const existing = await this.list();
      const found = existing.find(e => e.creatorId === creatorId);
      if (found) {
        await supabase.from('creator_shortlists').delete().eq('id', found.id);
      } else {
        await supabase.from('creator_shortlists').insert({ creator_id: creatorId, creator_name: creatorName });
      }
      return;
    }
    const list = lsGet<ShortlistEntry[]>(LS.shortlist, []);
    const idx = list.findIndex(e => e.creatorId === creatorId);
    if (idx >= 0) { list.splice(idx, 1); }
    else { list.unshift({ id: uid(), creatorId, creatorName, createdAt: new Date().toISOString() }); }
    lsSet(LS.shortlist, list);
  },
};

// ─────────────────────────────────────────────────────────────
// INVITE SERVICE
// ─────────────────────────────────────────────────────────────

export const inviteService = {
  async list(): Promise<InviteEntry[]> {
    if (supabase) {
      const { data, error } = await supabase.from('collaboration_invites').select('*').order('created_at', { ascending: false });
      if (error) return lsGet<InviteEntry[]>(LS.invites, []);
      return (data ?? []).map(r => ({
        id: r.id, venueName: r.venue_name, venuePincode: r.venue_pincode ?? '',
        creatorId: r.creator_id, creatorName: r.creator_name,
        packageSelected: r.package_selected ?? '', shootDate: r.shoot_date ?? '',
        budget: r.budget ?? '', message: r.message ?? '',
        status: r.status as InviteEntry['status'], createdAt: r.created_at,
      }));
    }
    return lsGet<InviteEntry[]>(LS.invites, []);
  },

  async create(entry: Omit<InviteEntry, 'id' | 'createdAt' | 'status'>): Promise<void> {
    if (supabase) {
      await supabase.from('collaboration_invites').insert({
        venue_name: entry.venueName, venue_pincode: entry.venuePincode,
        creator_id: entry.creatorId, creator_name: entry.creatorName,
        package_selected: entry.packageSelected, shoot_date: entry.shootDate,
        budget: entry.budget, message: entry.message,
      });
      return;
    }
    const list = lsGet<InviteEntry[]>(LS.invites, []);
    list.unshift({ ...entry, id: uid(), status: 'pending', createdAt: new Date().toISOString() });
    lsSet(LS.invites, list);
  },
};

// ─────────────────────────────────────────────────────────────
// UPI VERIFICATION SERVICE
// ─────────────────────────────────────────────────────────────

export const upiService = {
  async list(): Promise<UpiLog[]> {
    if (supabase) {
      const { data, error } = await supabase.from('upi_verifications').select('*').order('created_at', { ascending: false });
      if (error) return lsGet<UpiLog[]>(LS.upiLogs, []);
      return (data ?? []).map(r => ({
        id: r.id as string, brandName: r.brand_name ?? '', brandPhone: r.brand_phone ?? '',
        planTier: r.plan_tier as string, amount: r.amount as number, utrNumber: r.utr_number as string,
        status: r.status as UpiLog['status'], createdAt: r.created_at as string,
        brandId: r.brand_id as string | undefined,
      }));
    }
    return lsGet<UpiLog[]>(LS.upiLogs, []);
  },

  async submit(log: Omit<UpiLog, 'id' | 'createdAt' | 'status'>): Promise<void> {
    if (supabase) {
      await supabase.from('upi_verifications').insert({
        brand_name: log.brandName, brand_phone: log.brandPhone,
        plan_tier: log.planTier, amount: log.amount, utr_number: log.utrNumber,
      });
      return;
    }
    const list = lsGet<UpiLog[]>(LS.upiLogs, []);
    list.unshift({ ...log, id: uid(), status: 'pending', createdAt: new Date().toISOString() });
    lsSet(LS.upiLogs, list);
  },
};

// ─────────────────────────────────────────────────────────────
// ADMIN CONTROL ROOM SERVICE
// Server-enforced: privileged mutations run through SECURITY DEFINER
// functions that authorize the caller via auth.uid(). The browser
// never writes role / pro_expires_at / verification status directly.
// ─────────────────────────────────────────────────────────────

export const adminService = {
  async isAdmin(): Promise<boolean> {
    if (supabase) {
      const { data } = await supabase.rpc('is_admin');
      return Boolean(data);
    }
    // localStorage demo mode: an admin flag can be seeded for previewing.
    const user = lsGet<AuthUser | null>(LS.user, null);
    return user?.role === 'admin';
  },

  async listPendingUtrs(): Promise<UpiLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('upi_verifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(r => ({
        id: r.id as string,
        brandName: r.brand_name as string ?? '',
        brandPhone: r.brand_phone as string ?? '',
        planTier: r.plan_tier as string,
        amount: r.amount as number,
        utrNumber: r.utr_number as string,
        status: r.status as UpiLog['status'],
        createdAt: r.created_at as string,
        brandId: r.brand_id as string | undefined,
      }));
    }
    return lsGet<UpiLog[]>(LS.upiLogs, []).filter(u => u.status === 'pending');
  },

  async listAllUtrs(): Promise<UpiLog[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('upi_verifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(r => ({
        id: r.id as string,
        brandName: r.brand_name as string ?? '',
        brandPhone: r.brand_phone as string ?? '',
        planTier: r.plan_tier as string,
        amount: r.amount as number,
        utrNumber: r.utr_number as string,
        status: r.status as UpiLog['status'],
        createdAt: r.created_at as string,
        brandId: r.brand_id as string | undefined,
      }));
    }
    return lsGet<UpiLog[]>(LS.upiLogs, []);
  },

  async approveUtr(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.rpc('approve_upi_verification', { p_id: id });
      if (error) throw new Error(error.message);
      return;
    }
    const list = lsGet<UpiLog[]>(LS.upiLogs, []);
    const item = list.find(u => u.id === id);
    if (item) { item.status = 'approved'; lsSet(LS.upiLogs, list); this._audit('approve_utr', { id, plan: item.planTier }); }
  },

  async rejectUtr(id: string, reason = 'Invalid UTR'): Promise<void> {
    if (supabase) {
      const { error } = await supabase.rpc('reject_upi_verification', { p_id: id, p_reason: reason });
      if (error) throw new Error(error.message);
      return;
    }
    const list = lsGet<UpiLog[]>(LS.upiLogs, []);
    const item = list.find(u => u.id === id);
    if (item) { item.status = 'rejected'; lsSet(LS.upiLogs, list); this._audit('reject_utr', { id, reason }); }
  },

  async listBrands(): Promise<BrandRow[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(r => ({
        id: r.id as string,
        email: r.email as string,
        fullName: r.full_name as string,
        role: r.role as AuthRole,
        venueName: r.venue_name as string | null,
        pincode: r.pincode as string | null,
        phone: r.phone as string | null,
        proExpiresAt: r.pro_expires_at as string | null,
        createdAt: r.created_at as string,
      }));
    }
    return [];
  },

  async setBrandRole(userId: string, role: AuthRole): Promise<void> {
    if (supabase) {
      const { error } = await supabase.rpc('set_brand_role', { p_user_id: userId, p_role: role });
      if (error) throw new Error(error.message);
      return;
    }
    this._audit(role === 'pro_brand' ? 'upgrade_brand' : 'downgrade_brand', { userId, newRole: role });
  },

  async listAuditLog(): Promise<AuditEntry[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(r => ({
        id: r.id as string,
        adminId: r.admin_id as string,
        action: r.action as AuditEntry['action'],
        targetUserId: r.target_user_id as string | null,
        targetTable: r.target_table as string | null,
        targetId: r.target_id as string | null,
        detail: (r.detail as Record<string, unknown>) ?? {},
        createdAt: r.created_at as string,
      }));
    }
    return lsGet<AuditEntry[]>(LS.auditLog, []);
  },

  _audit(action: AuditEntry['action'], detail: Record<string, unknown>): void {
    const list = lsGet<AuditEntry[]>(LS.auditLog, []);
    list.unshift({
      id: uid(), adminId: 'local', action, detail,
      createdAt: new Date().toISOString(),
    });
    lsSet(LS.auditLog, list);
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Brand Dashboard Service — Brand Hub profile + campaigns
// ─────────────────────────────────────────────────────────────────────────
export const brandHubService = {
  async saveBrandProfile(userId: string, input: BrandProfileInput): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          venue_name: input.brandName,
          phone: input.phone,
          address: input.address,
          brand_type: input.brandType,
          venue_images: input.venueImages ?? [],
        })
        .eq('id', userId);
      if (error) throw new Error(error.message);
      return;
    }
    const user = lsGet<AuthUser>(LS.user, null);
    if (user) {
      user.venueName = input.brandName;
      user.phone = input.phone;
      lsSet(LS.user, user);
    }
  },

  async getBrandProfile(userId: string): Promise<BrandRow | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id as string,
        email: data.email as string,
        fullName: (data.full_name as string) ?? '',
        role: (data.role as AuthRole) ?? 'free_brand',
        venueName: (data.venue_name as string) ?? null,
        pincode: (data.pincode as string) ?? null,
        phone: (data.phone as string) ?? null,
        brandType: (data.brand_type as string) ?? null,
        address: (data.address as string) ?? null,
        venueImages: ((data.venue_images as string[]) ?? []) as string[],
        proExpiresAt: (data.pro_expires_at as string) ?? null,
        createdAt: data.created_at as string,
      };
    }
    const user = lsGet<AuthUser>(LS.user, null);
    if (!user || user.id !== userId) return null;
    return {
      id: user.id, email: user.email, fullName: user.fullName, role: user.role,
      venueName: user.venueName, pincode: user.pincode, phone: user.phone,
      brandType: 'Hotel', address: 'Kalewadi, Pune', venueImages: [],
      proExpiresAt: null,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Telemetry Service — Profile activity & click tracking
// ─────────────────────────────────────────────────────────────────────────
export const telemetry = {
  logActivity(params: {
    actorId?: string | null;
    actorEmail?: string | null;
    targetProfileId?: string | null;
    targetName?: string | null;
    activityType: string;
    meta?: Record<string, unknown>;
  }): void {
    const entry: ActivityEntry = {
      id: uid(),
      actorId: params.actorId ?? null,
      actorEmail: params.actorEmail ?? null,
      targetProfileId: params.targetProfileId ?? null,
      targetName: params.targetName ?? null,
      activityType: params.activityType,
      meta: params.meta ?? {},
      createdAt: new Date().toISOString(),
    };
    // Best-effort: push to localStorage always, then try to flush to Supabase
    const list = lsGet<ActivityEntry[]>(LS.activity, []);
    list.unshift(entry);
    lsSet(LS.activity, list.slice(0, 200));
    if (supabase) {
      supabase.from('profile_activity').insert({
        actor_id: entry.actorId,
        actor_email: entry.actorEmail,
        target_profile_id: entry.targetProfileId,
        target_name: entry.targetName,
        activity_type: entry.activityType,
        meta: entry.meta,
      }).then(() => {}, () => {});
    }
  },

  async listActivity(limit = 100): Promise<ActivityEntry[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('profile_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) return lsGet<ActivityEntry[]>(LS.activity, []);
      return (data as Record<string, unknown>[]).map(r => ({
        id: r.id as string,
        actorId: (r.actor_id as string) ?? null,
        actorEmail: (r.actor_email as string) ?? null,
        targetProfileId: (r.target_profile_id as string) ?? null,
        targetName: (r.target_name as string) ?? null,
        activityType: r.activity_type as string,
        meta: (r.meta as Record<string, unknown>) ?? {},
        createdAt: r.created_at as string,
      }));
    }
    return lsGet<ActivityEntry[]>(LS.activity, []);
  },
};
