import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle, Clock, IndianRupee,
  Crown, ArrowLeft, AlertTriangle, History, Users, Wallet, Lock, BadgeCheck,
} from 'lucide-react';
import {
  adminService, upiService,
  type UpiLog, type BrandRow, type AuditEntry, type AuthRole,
} from '@/lib/supabase';

type Tab = 'utr' | 'brands' | 'audit';

export default function AdminControlRoom({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>('utr');
  const [utrs, setUtrs] = useState<UpiLog[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid UTR');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, b, a] = await Promise.all([
        adminService.listAllUtrs(),
        adminService.listBrands(),
        adminService.listAuditLog(),
      ]);
      setUtrs(u);
      setBrands(b);
      setAudit(a);
    } catch (e) {
      flash('err', (e as Error).message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function flash(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2600);
  }

  async function approve(id: string) {
    setBusy(id);
    try {
      await adminService.approveUtr(id);
      flash('ok', 'UTR approved — brand upgraded to Pro');
      await refresh();
    } catch (e) {
      flash('err', mapError((e as Error).message));
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string, reason: string) {
    setBusy(id);
    try {
      await adminService.rejectUtr(id, reason);
      flash('ok', 'UTR rejected');
      setRejectId(null);
      setRejectReason('Invalid UTR');
      await refresh();
    } catch (e) {
      flash('err', mapError((e as Error).message));
    } finally {
      setBusy(null);
    }
  }

  async function setRole(userId: string, role: AuthRole) {
    setBusy(`role-${userId}`);
    try {
      await adminService.setBrandRole(userId, role);
      flash('ok', `Role updated to ${role.replace('_', ' ')}`);
      await refresh();
    } catch (e) {
      flash('err', mapError((e as Error).message));
    } finally {
      setBusy(null);
    }
  }

  const pending = utrs.filter(u => u.status === 'pending');
  const processed = utrs.filter(u => u.status !== 'pending');

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      {/* header */}
      <header className="sticky top-0 z-40 bg-ink-950/95 backdrop-blur-xl border-b border-gold-700/20 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-ink-800 text-gold-300 border border-gold-600/40 hover:bg-ink-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-gold-500 to-gold-800 flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-5 h-5 text-ink-950" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold gold-text leading-none">Admin Control Room</h1>
              <p className="text-[11px] text-sand-500 mt-0.5">Private · UTR verification & Pro upgrades</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-ink-800 rounded-full p-1 border border-ink-600">
          {([
            { k: 'utr' as const, label: 'UTR Queue', icon: Wallet, count: pending.length },
            { k: 'brands' as const, label: 'Brands', icon: Users, count: brands.length },
            { k: 'audit' as const, label: 'Audit Log', icon: History, count: audit.length },
          ]).map(t => {
            const Icon = t.icon;
            const active = tab === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${active ? 'bg-gold-500 text-ink-950' : 'text-sand-400 hover:text-sand-200'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count > 0 && (
                  <span className={`ml-0.5 text-[10px] font-bold px-1.5 rounded-full ${active ? 'bg-ink-950/20 text-ink-950' : 'bg-gold-900/40 text-gold-300'}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* main */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-sand-500">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
            <p className="text-sm">Loading control room…</p>
          </div>
        ) : tab === 'utr' ? (
          <UtrQueue
            pending={pending}
            processed={processed}
            busy={busy}
            onApprove={approve}
            onRejectOpen={(id) => { setRejectId(id); setRejectReason('Invalid UTR'); }}
          />
        ) : tab === 'brands' ? (
          <BrandPanel brands={brands} busy={busy} onSetRole={setRole} />
        ) : (
          <AuditPanel entries={audit} />
        )}
      </main>

      {/* reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setRejectId(null)}>
          <div className="bg-ink-800 rounded-2xl border border-gold-600/40 p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-ember-500" />
              <h3 className="font-display text-lg font-bold text-sand-50">Reject UTR?</h3>
            </div>
            <label className="text-sand-400 text-xs mb-1.5 block">Reason</label>
            <input
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 text-sm font-semibold py-2.5 rounded-full bg-ink-700 text-sand-300 hover:bg-ink-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reject(rejectId, rejectReason || 'Invalid UTR')}
                className="flex-1 text-sm font-semibold py-2.5 rounded-full bg-red-600/90 text-white hover:bg-red-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-fade-up">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-full border shadow-glow text-sm font-medium ${toast.kind === 'ok' ? 'bg-green-600/15 border-green-500/40 text-green-300' : 'bg-red-600/15 border-red-500/40 text-red-300'}`}>
            {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function mapError(msg: string): string {
  if (/not authorized/i.test(msg)) return 'Not authorized — admin role required';
  if (/not found or already processed/i.test(msg)) return 'Already processed';
  if (/cannot change your own/i.test(msg)) return 'You cannot change your own role';
  if (/invalid role/i.test(msg)) return 'Invalid role value';
  return 'Action failed. Try again.';
}

// ── UTR QUEUE ──────────────────────────────────────────────────────

function UtrQueue({
  pending, processed, busy, onApprove, onRejectOpen,
}: {
  pending: UpiLog[];
  processed: UpiLog[];
  busy: string | null;
  onApprove: (id: string) => void;
  onRejectOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pending" value={pending.length} accent="ember" />
        <StatCard icon={CheckCircle2} label="Approved" value={processed.filter(u => u.status === 'approved').length} accent="green" />
        <StatCard icon={XCircle} label="Rejected" value={processed.filter(u => u.status === 'rejected').length} accent="red" />
        <StatCard icon={IndianRupee} label="Revenue" value={`₹${processed.filter(u => u.status === 'approved').reduce((s, u) => s + u.amount, 0).toLocaleString('en-IN')}`} accent="gold" />
      </div>

      {/* pending queue */}
      <section>
        <h2 className="font-display text-2xl font-bold text-sand-50 mb-1 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-gold-500" /> Pending UTR Verifications
        </h2>
        <p className="text-sm text-sand-500 mb-5">12-digit UPI reference numbers awaiting approval</p>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-ink-600 bg-ink-800 p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500/70 mx-auto mb-3" />
            <p className="text-sand-300 font-medium">All clear — no pending UTRs</p>
            <p className="text-sand-500 text-sm mt-1">New submissions will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(u => (
              <div key={u.id} className="rounded-2xl border border-gold-700/30 bg-ink-800 p-5 hover:border-gold-600/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-lg font-bold gold-text tracking-wider">{u.utrNumber}</span>
                      <span className="text-[10px] font-bold bg-ember-500/15 text-ember-400 px-2 py-0.5 rounded-full">PENDING</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <Field label="Brand" value={u.brandName || '—'} />
                      <Field label="Phone" value={u.brandPhone || '—'} />
                      <Field label="Plan" value={u.planTier} />
                      <Field label="Amount" value={`₹${u.amount.toLocaleString('en-IN')}`} accent />
                    </div>
                    <p className="text-xs text-sand-500 mt-2">Submitted {timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onRejectOpen(u.id)}
                      disabled={busy === u.id}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-full bg-ink-700 text-sand-300 hover:bg-red-600/80 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => onApprove(u.id)}
                      disabled={busy === u.id}
                      className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 hover:shadow-glow transition-shadow disabled:opacity-50"
                    >
                      {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve & Unlock
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* recent processed */}
      {processed.length > 0 && (
        <section>
          <h3 className="font-display text-lg font-bold text-sand-200 mb-3">Recently Processed</h3>
          <div className="rounded-2xl border border-ink-600 bg-ink-800 overflow-hidden">
            {processed.slice(0, 8).map((u, i) => (
              <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-ink-700' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${u.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-sm text-sand-200 truncate">{u.utrNumber}</span>
                  <span className="text-xs text-sand-500 hidden sm:inline">{u.brandName || '—'}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gold-400 font-semibold">₹{u.amount.toLocaleString('en-IN')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {u.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── BRAND PANEL ────────────────────────────────────────────────────

function BrandPanel({
  brands, busy, onSetRole,
}: {
  brands: BrandRow[];
  busy: string | null;
  onSetRole: (userId: string, role: AuthRole) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = brands.filter(b =>
    b.fullName.toLowerCase().includes(q.toLowerCase()) ||
    b.email.toLowerCase().includes(q.toLowerCase()) ||
    (b.venueName ?? '').toLowerCase().includes(q.toLowerCase())
  );

  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-600 bg-ink-800 p-10 text-center">
        <Users className="w-10 h-10 text-sand-500 mx-auto mb-3" />
        <p className="text-sand-300 font-medium">No brand profiles yet</p>
        <p className="text-sand-500 text-sm mt-1">Sign-ups will appear here once the marketplace has registered brands.</p>
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-sand-50 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" /> Brand Accounts
          </h2>
          <p className="text-sm text-sand-500 mt-0.5">Manually upgrade or downgrade a brand's tier</p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name, email, venue…"
          className="bg-ink-800 text-sand-100 text-sm px-4 py-2.5 rounded-full border border-ink-600 focus:border-gold-600 outline-none w-full md:w-72"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map(b => {
          const isPro = b.role === 'pro_brand';
          const isAdmin = b.role === 'admin';
          return (
            <div key={b.id} className="rounded-2xl border border-ink-600 bg-ink-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isAdmin ? 'bg-gold-500/20 border border-gold-500/40' : isPro ? 'bg-gold-900/40 border border-gold-700/40' : 'bg-ink-700 border border-ink-600'}`}>
                  {isAdmin ? <ShieldCheck className="w-5 h-5 text-gold-400" /> : isPro ? <Crown className="w-5 h-5 text-gold-400" /> : <Lock className="w-4 h-4 text-sand-500" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sand-100 truncate flex items-center gap-1.5">
                    {b.fullName}
                    {isPro && <BadgeCheck className="w-4 h-4 text-gold-400 shrink-0" />}
                  </p>
                  <p className="text-xs text-sand-500 truncate">{b.email}{b.venueName ? ` · ${b.venueName}` : ''}</p>
                  {b.proExpiresAt && (
                    <p className="text-[11px] text-gold-400 mt-0.5">Pro expires {new Date(b.proExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isAdmin ? 'bg-gold-500/20 text-gold-300' : isPro ? 'bg-green-500/15 text-green-400' : 'bg-ink-700 text-sand-400'}`}>
                  {b.role.toUpperCase().replace('_', ' ')}
                </span>
                {!isAdmin && (
                  <button
                    onClick={() => onSetRole(b.id, isPro ? 'free_brand' : 'pro_brand')}
                    disabled={busy === `role-${b.id}`}
                    className={`text-xs font-semibold px-3 py-2 rounded-full transition-colors flex items-center gap-1.5 disabled:opacity-50 ${isPro ? 'bg-ink-700 text-sand-300 hover:bg-ink-600' : 'bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 hover:shadow-glow'}`}
                  >
                    {busy === `role-${b.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPro ? <Lock className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                    {isPro ? 'Downgrade' : 'Upgrade to Pro'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── AUDIT PANEL ────────────────────────────────────────────────────

function AuditPanel({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-600 bg-ink-800 p-10 text-center">
        <History className="w-10 h-10 text-sand-500 mx-auto mb-3" />
        <p className="text-sand-300 font-medium">No admin actions recorded yet</p>
        <p className="text-sand-500 text-sm mt-1">Approvals and role changes will be logged here.</p>
      </div>
    );
  }
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-sand-50 mb-5 flex items-center gap-2">
        <History className="w-5 h-5 text-gold-500" /> Admin Audit Trail
      </h2>
      <div className="rounded-2xl border border-ink-600 bg-ink-800 overflow-hidden">
        {entries.map((e, i) => {
          const Icon = e.action.startsWith('approve') ? CheckCircle2 : e.action.startsWith('reject') ? XCircle : e.action === 'upgrade_brand' ? Crown : Lock;
          const tone = e.action.startsWith('approve') || e.action === 'upgrade_brand' ? 'text-green-400' : e.action.startsWith('reject') ? 'text-red-400' : 'text-sand-400';
          return (
            <div key={e.id} className={`flex items-start gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-ink-700' : ''}`}>
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tone}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sand-100">
                  <span className="font-semibold">{labelFor(e.action)}</span>
                  {e.detail && Object.keys(e.detail).length > 0 && (
                    <span className="text-sand-500"> · {Object.entries(e.detail).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}</span>
                  )}
                </p>
                <p className="text-[11px] text-sand-500 mt-0.5">{timeAgo(e.createdAt)} · admin {e.adminId.slice(0, 8)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function labelFor(action: AuditEntry['action']): string {
  switch (action) {
    case 'approve_utr': return 'Approved UTR & unlocked Pro';
    case 'reject_utr': return 'Rejected UTR';
    case 'upgrade_brand': return 'Upgraded brand to Pro';
    case 'downgrade_brand': return 'Downgraded brand';
  }
}

// ── small parts ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Clock; label: string; value: number | string; accent: 'ember' | 'green' | 'red' | 'gold' }) {
  const tone = {
    ember: 'text-ember-400 bg-ember-500/10 border-ember-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    gold: 'text-gold-400 bg-gold-500/10 border-gold-700/30',
  }[accent];
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <Icon className="w-5 h-5 mb-2" strokeWidth={1.5} />
      <p className="text-xs text-sand-400">{label}</p>
      <p className="font-display text-2xl font-bold text-sand-50 mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-sand-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${accent ? 'text-gold-300' : 'text-sand-100'}`}>{value}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
