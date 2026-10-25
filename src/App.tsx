import { useState, useMemo, useEffect } from 'react';
import {
  Play, Eye, Lock, Star, Check, BadgeCheck, Instagram, Facebook, Youtube,
  MessageCircle, Phone, MapPin, Search, Users, Building2, Handshake,
  IndianRupee, TrendingUp, Video, Filter, ArrowRight, X, ShieldCheck,
  Crown, Zap, Heart, UserPlus, Briefcase, ChevronRight, ArrowLeft,
  Sun, Moon, Image as ImageIcon, Film, Send, MessageSquare, Pencil,
  CheckCircle2, Sparkle, Plus, Clapperboard, Wallet, LogIn,
  LayoutDashboard, Loader2, Menu, ChevronLeft, Mail, FileText, Globe,
} from 'lucide-react';
import {
  authService, portfolioService, shortlistService, inviteService,
  upiService, adminService, brandHubService, telemetry, hasSupabase,
  type AuthUser, type AuthRole, type NewCreator, type ShortlistEntry,
  type InviteEntry, type UpiLog,
} from '@/lib/supabase';
import AdminControlRoom from '@/AdminControlRoom';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type UserRole = 'free_brand' | 'pro_brand' | 'creator_owner' | 'creator' | 'admin';
type ViewMode =
  | 'home' | 'explore' | 'pricing' | 'about' | 'login'
  | 'portfolio' | 'creator_onboarding' | 'brand_dashboard' | 'admin_control_room'
  | 'food_influencers' | 'reel_makers' | 'digital_marketers'
  | 'contact' | 'privacy' | 'terms';
type Creator = typeof CREATORS[number];

type CreatorProfile = {
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
  bio: string;
  igHandle: string;
  fbPage: string;
  ytChannel: string;
  phone: string;
  whatsapp: string;
};

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────

const REELS = [
  { id: 1, views: '128K', title: 'Sunset Lounge Tasting', img: 'https://images.pexels.com/photos/19343364/pexels-photo-19343364.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', tag: 'Reel' },
  { id: 2, views: '92K', title: 'Craft Cocktail Sessions', img: 'https://images.pexels.com/photos/31285170/pexels-photo-31285170.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', tag: 'Reel' },
  { id: 3, views: '215K', title: 'Café Latte Art Reel', img: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', tag: 'Reel' },
  { id: 4, views: '176K', title: 'Rooftop Fine-Dine Vibe', img: 'https://images.pexels.com/photos/36747296/pexels-photo-36747296.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', tag: 'Reel' },
  { id: 5, views: '64K', title: 'Street Food Story', img: 'https://images.pexels.com/photos/11161325/pexels-photo-11161325.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', tag: 'Reel' },
];

const CREATORS = [
  { id: 1, name: 'Aarav Kulkarni', category: 'Restaurants', subcategory: 'Food Influencer', platform: 'instagram', gender: 'male', pincode: '411017', area: 'Kalewadi', followers: '248K', rate: '₹15,000', rating: 4.9, img: 'https://images.pexels.com/photos/5528969/pexels-photo-5528969.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 2, name: 'Sanya Patil', category: 'Cafes', subcategory: 'Reel Maker', platform: 'instagram', gender: 'female', pincode: '411057', area: 'Wakad', followers: '512K', rate: '₹28,000', rating: 5.0, img: 'https://images.pexels.com/photos/6497114/pexels-photo-6497114.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 3, name: 'Rohan Deshmukh', category: 'Pubs', subcategory: 'Reel Maker', platform: 'youtube', gender: 'male', pincode: '411045', area: 'Baner', followers: '1.2M', rate: '₹45,000', rating: 4.8, img: 'https://images.pexels.com/photos/16160801/pexels-photo-16160801.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 4, name: 'Meera Joshi', category: 'Cloud Kitchens', subcategory: 'Digital Marketer', platform: 'facebook', gender: 'female', pincode: '411017', area: 'Kalewadi', followers: '186K', rate: '₹9,500', rating: 4.7, img: 'https://images.pexels.com/photos/19279538/pexels-photo-19279538.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 5, name: 'Karan Mehta', category: 'Restaurants', subcategory: 'Food Influencer', platform: 'youtube', gender: 'male', pincode: '411057', area: 'Wakad', followers: '780K', rate: '₹32,000', rating: 4.9, img: 'https://images.pexels.com/photos/2101154/pexels-photo-2101154.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 6, name: 'Priya Nair', category: 'Cafes', subcategory: 'Freelance Marketing Agent', platform: 'instagram', gender: 'female', pincode: '411045', area: 'Baner', followers: '340K', rate: '₹18,000', rating: 4.8, img: 'https://images.pexels.com/photos/34930167/pexels-photo-34930167.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: false },
  { id: 7, name: 'Aditya Rao', category: 'Pubs', subcategory: 'Reel Maker', platform: 'instagram', gender: 'male', pincode: '411017', area: 'Kalewadi', followers: '420K', rate: '₹22,000', rating: 4.8, img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: true },
  { id: 8, name: 'Diya Shah', category: 'Restaurants', subcategory: 'Digital Marketer', platform: 'facebook', gender: 'female', pincode: '411057', area: 'Wakad', followers: '295K', rate: '₹14,000', rating: 4.7, img: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', verified: false },
];

// large hero photography for the 3D coverflow
const CREATOR_HERO_IMG: Record<number, string> = {
  1: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  2: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  3: 'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  4: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  5: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  6: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  7: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
  8: 'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&h=800&w=600',
};

const PARTNERS = [
  { pincode: '411017', area: 'Kalewadi', name: 'The Black Pearl', type: 'Resto-Bar', rating: 4.8, img: 'https://images.pexels.com/photos/30235758/pexels-photo-30235758.jpeg?auto=compress&cs=tinysrgb&h=400&w=600' },
  { pincode: '411057', area: 'Wakad', name: 'Mocha Mint Lounge', type: 'Café', rating: 4.7, img: 'https://images.pexels.com/photos/244407/pexels-photo-244407.jpeg?auto=compress&cs=tinysrgb&h=400&w=600' },
  { pincode: '411045', area: 'Baner', name: 'Skyline Brew & Co', type: 'Pub', rating: 4.9, img: 'https://images.pexels.com/photos/5163405/pexels-photo-5163405.jpeg?auto=compress&cs=tinysrgb&h=400&w=600' },
  { pincode: '411017', area: 'Kalewadi', name: 'Saffron Cloud Kitchen', type: 'Cloud Kitchen', rating: 4.6, img: 'https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&h=400&w=600' },
];

const TESTIMONIALS = [
  { quote: 'KROLAB connected us with three food creators in a week. Our weekend footfall jumped 40%. No agency, no markup.', name: 'Aditya Rane', role: 'Owner, The Black Pearl — Kalewadi', img: 'https://images.pexels.com/photos/19343364/pexels-photo-19343364.jpeg?auto=compress&cs=tinysrgb&h=200&w=200' },
  { quote: 'We saved ₹40,000 in agency commissions on a single campaign. Direct WhatsApp contact changed everything.', name: 'Shruti Kale', role: 'Founder, Mocha Mint Lounge — Wakad', img: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?auto=compress&cs=tinysrgb&h=200&w=200' },
  { quote: 'As a creator, my inbox went from zero to fifteen resto-bar leads after listing. Zero cut taken by the platform.', name: 'Vikram Shah', role: 'Food & Lifestyle Creator — Baner', img: 'https://images.pexels.com/photos/8357681/pexels-photo-8357681.jpeg?auto=compress&cs=tinysrgb&h=200&w=200' },
];

const PRICING = [
  { tier: 'Free Brand', price: '₹0', period: 'forever', tagline: 'Explore the marketplace', features: ['Browse all creator profiles', 'Locked contact details', 'Save up to 5 favourites', 'Community forum access'], cta: 'Get Started', highlight: false, icon: Building2 },
  { tier: 'Pro Weekly Pass', price: '₹599', period: '/week', tagline: 'Featured · Most Popular', features: ['Unlock all direct contacts', 'Unlimited WhatsApp & calls', 'Instant pincode matchmaking', 'Verified rate cards', 'Priority listing rank'], cta: 'Unlock Pro Weekly', highlight: true, icon: Crown },
  { tier: 'Pro Monthly Pass', price: '₹1,499', period: '/month', tagline: 'Best value for active venues', features: ['Everything in Weekly Pass', 'Campaign dashboard', 'Multi-venue management', 'Performance analytics', 'Dedicated support line'], cta: 'Go Monthly Pro', highlight: false, icon: Zap },
  { tier: 'Creator Account', price: 'Free', period: '0% cut', tagline: 'For influencers & creators', features: ['Full portfolio upload', 'Real-time lead inbox', 'Set your own rate card', 'Zero platform commission', 'Verified badge eligibility'], cta: 'Join as Creator', highlight: false, icon: Sparkle },
];

const COLLAGE = [
  'https://images.pexels.com/photos/36747296/pexels-photo-36747296.jpeg?auto=compress&cs=tinysrgb&h=500&w=500',
  'https://images.pexels.com/photos/8942307/pexels-photo-8942307.jpeg?auto=compress&cs=tinysrgb&h=500&w=500',
  'https://images.pexels.com/photos/8922191/pexels-photo-8922191.jpeg?auto=compress&cs=tinysrgb&h=500&w=500',
  'https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&h=500&w=500',
];

const AVATARS = [
  'https://images.pexels.com/photos/6497114/pexels-photo-6497114.jpeg?auto=compress&cs=tinysrgb&h=80&w=80',
  'https://images.pexels.com/photos/5528969/pexels-photo-5528969.jpeg?auto=compress&cs=tinysrgb&h=80&w=80',
  'https://images.pexels.com/photos/19279538/pexels-photo-19279538.jpeg?auto=compress&cs=tinysrgb&h=80&w=80',
  'https://images.pexels.com/photos/16160801/pexels-photo-16160801.jpeg?auto=compress&cs=tinysrgb&h=80&w=80',
  'https://images.pexels.com/photos/34930167/pexels-photo-34930167.jpeg?auto=compress&cs=tinysrgb&h=80&w=80',
];

const PORTFOLIO_REELS = [
  { id: 1, views: '142K', title: 'Truffle Pizza Launch — The Black Pearl', img: 'https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', pincode: '411017', dish: 'Truffle Pizza', conversions: '38 table bookings' },
  { id: 2, views: '98K', title: 'Craft Cocktail Flight — Skyline Brew', img: 'https://images.pexels.com/photos/31285170/pexels-photo-31285170.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', pincode: '411045', dish: 'Signature Negroni', conversions: '52 weekend walk-ins' },
  { id: 3, views: '215K', title: 'Latte Art Sunday — Mocha Mint Lounge', img: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', pincode: '411057', dish: 'Rose Latte', conversions: '74 cafe visits' },
  { id: 4, views: '76K', title: 'Weekend Buffet Spotlight — Saffron Kitchen', img: 'https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', pincode: '411017', dish: 'Thali Combo', conversions: '41 pre-bookings' },
  { id: 5, views: '114K', title: 'Rooftop Sunset Tasting — The Black Pearl', img: 'https://images.pexels.com/photos/36747296/pexels-photo-36747296.jpeg?auto=compress&cs=tinysrgb&h=900&w=506', pincode: '411017', dish: 'Chef\'s Tasting Menu', conversions: '29 reservations' },
];

const GALLERY_SHOTS = [
  { img: 'https://images.pexels.com/photos/36747296/pexels-photo-36747296.jpeg?auto=compress&cs=tinysrgb&h=600&w=600', title: 'Rooftop Ambiance', span: 'lg:col-span-2 lg:row-span-2' },
  { img: 'https://images.pexels.com/photos/27851286/pexels-photo-27851286.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', title: 'Cocktail Mixology', span: '' },
  { img: 'https://images.pexels.com/photos/34255748/pexels-photo-34255748.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', title: 'Café Pour', span: '' },
  { img: 'https://images.pexels.com/photos/4253315/pexels-photo-4253315.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', title: 'Chef Plating', span: '' },
  { img: 'https://images.pexels.com/photos/8922191/pexels-photo-8922191.jpeg?auto=compress&cs=tinysrgb&h=400&w=400', title: 'Guest Experience', span: '' },
];

const AUDIENCE_BARS = [
  { pincode: '411017', area: 'Kalewadi / Pimpri / Rahatani', pct: 44 },
  { pincode: '411057', area: 'Wakad / Hinjewadi IT Park', pct: 31 },
  { pincode: '411045', area: 'Baner / Balewadi High Street', pct: 25 },
];

const CATEGORIES_FULL = ['Restaurants', 'Cafes', 'Pubs', 'Cloud Kitchens'];
const PINCODE_AREAS: Record<string, string> = { '411017': 'Kalewadi', '411057': 'Wakad', '411045': 'Baner' };
const ALL_PINCODES = ['all', '411017', '411057', '411045'];

const CATEGORY_PAGES: { view: ViewMode; title: string; sub: string; filter: string }[] = [
  { view: 'reel_makers', title: 'Reel Makers', sub: 'Reel Maker', filter: 'reel' },
  { view: 'food_influencers', title: 'Food Influencers', sub: 'Food Influencer', filter: 'food' },
  { view: 'digital_marketers', title: 'Digital Marketers', sub: 'Digital Marketer', filter: 'digital' },
];

function buildProfile(c: Creator): CreatorProfile {
  const firstName = c.name.split(' ')[0].toLowerCase();
  return {
    ...c,
    bio: 'Signature Menu Launches, Weekend Buffet Spotlights & High-Conversion Resto-Bar Reels across Pune',
    igHandle: `@${firstName}.foodie`,
    fbPage: `${firstName}.foodie.pune`,
    ytChannel: `@${firstName}eats`,
    phone: '+91 98234 56789',
    whatsapp: '919823456789',
  };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC NAV HEADER
// ─────────────────────────────────────────────────────────────

function PublicHeader({
  currentView, setView, user, isAdmin, onLogout,
}: {
  currentView: ViewMode;
  setView: (v: ViewMode) => void;
  user: AuthUser | null;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const go = (v: ViewMode) => { setView(v); setOpen(false); setMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const navItems: { label: string; view: ViewMode }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Explore Creators', view: 'explore' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'About Us', view: 'about' },
  ];

  return (
    <header className="sticky top-0 z-[60] bg-ink-950/95 backdrop-blur-xl border-b border-gold-700/20">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* logo */}
        <button onClick={() => go('home')} className="flex items-center gap-1 shrink-0">
          <span className="font-display text-2xl font-bold gold-text tracking-wider">KR</span>
          <Check className="w-4 h-4 text-gold-500" strokeWidth={3} />
          <span className="font-display text-2xl font-bold gold-text tracking-wider">LAB</span>
          <span className="text-sand-500 text-sm ml-0.5">.IN</span>
        </button>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(n => (
            <button
              key={n.view}
              onClick={() => go(n.view)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${currentView === n.view ? 'text-gold-300 bg-gold-600/10' : 'text-sand-300 hover:text-gold-300 hover:bg-ink-800'}`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenu(m => !m)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-gold-500 text-ink-950 hover:bg-gold-400 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user.fullName || user.email.split('@')[0]}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${menu ? 'rotate-90' : ''}`} />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 top-12 z-20 w-56 bg-ink-800 border border-gold-600/40 rounded-2xl shadow-glow-lg py-2 overflow-hidden">
                    <div className="px-4 py-2 border-b border-ink-600">
                      <p className="text-sand-100 text-sm font-semibold truncate">{user.fullName || 'Account'}</p>
                      <p className="text-sand-500 text-xs truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300">{user.role.replace('_', ' ')}</span>
                    </div>
                    {user.role === 'admin' && (
                      <button onClick={() => go('admin_control_room')} className="w-full text-left px-4 py-2.5 text-sm text-sand-200 hover:bg-ink-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gold-400" /> Admin Control Room
                      </button>
                    )}
                    {(user.role === 'free_brand' || user.role === 'pro_brand') && (
                      <button onClick={() => go('brand_dashboard')} className="w-full text-left px-4 py-2.5 text-sm text-sand-200 hover:bg-ink-700 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-gold-400" /> Brand Hub
                      </button>
                    )}
                    {user.role === 'creator' && (
                      <button onClick={() => go('creator_onboarding')} className="w-full text-left px-4 py-2.5 text-sm text-sand-200 hover:bg-ink-700 flex items-center gap-2">
                        <Clapperboard className="w-4 h-4 text-gold-400" /> Creator Studio
                      </button>
                    )}
                    <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-ink-700 flex items-center gap-2 border-t border-ink-600">
                      <ArrowLeft className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => go('login')}
              className="hidden md:flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full border border-gold-600/50 text-gold-300 hover:bg-gold-600/10 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login / Sign Up
            </button>
          )}

          {/* mobile toggle */}
          <button onClick={() => setOpen(o => !o)} className="md:hidden w-10 h-10 rounded-full bg-ink-800 border border-ink-600 flex items-center justify-center text-gold-300">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gold-700/20 bg-ink-950 px-5 py-4 space-y-1">
          {navItems.map(n => (
            <button key={n.view} onClick={() => go(n.view)} className={`block w-full text-left text-sm font-medium px-4 py-3 rounded-xl ${currentView === n.view ? 'text-gold-300 bg-gold-600/10' : 'text-sand-300 hover:bg-ink-800'}`}>
              {n.label}
            </button>
          ))}
          <div className="pt-2 border-t border-ink-700">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <button onClick={() => go('admin_control_room')} className="block w-full text-left text-sm font-medium px-4 py-3 rounded-xl text-sand-200 hover:bg-ink-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold-400" /> Admin Control Room
                  </button>
                )}
                {(user.role === 'free_brand' || user.role === 'pro_brand') && (
                  <button onClick={() => go('brand_dashboard')} className="block w-full text-left text-sm font-medium px-4 py-3 rounded-xl text-sand-200 hover:bg-ink-800 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-gold-400" /> Brand Hub
                  </button>
                )}
                {user.role === 'creator' && (
                  <button onClick={() => go('creator_onboarding')} className="block w-full text-left text-sm font-medium px-4 py-3 rounded-xl text-sand-200 hover:bg-ink-800 flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-gold-400" /> Creator Studio
                  </button>
                )}
                <button onClick={onLogout} className="block w-full text-left text-sm font-medium px-4 py-3 rounded-xl text-red-400 hover:bg-ink-800 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <button onClick={() => go('login')} className="block w-full text-left text-sm font-semibold px-4 py-3 rounded-xl text-gold-300 border border-gold-600/40 flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 1 — 3D CREATOR COVERFLOW HERO
// ─────────────────────────────────────────────────────────────

function Section1Hero({ onViewPortfolio, setView }: { onViewPortfolio: (c: Creator) => void; setView: (v: ViewMode) => void }) {
  const [pincode, setPincode] = useState('all');
  const [centerIdx, setCenterIdx] = useState(0);

  const slides = useMemo(() => {
    const list = pincode === 'all' ? CREATORS : CREATORS.filter(c => c.pincode === pincode);
    return list.length > 0 ? list : CREATORS;
  }, [pincode]);

  useEffect(() => {
    if (centerIdx >= slides.length) setCenterIdx(0);
  }, [slides.length, centerIdx]);

  const visible = slides.slice(Math.max(0, centerIdx - 2), centerIdx + 3);
  const centerCreator = slides[centerIdx] ?? slides[0];

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-ink-950 flex flex-col items-center justify-center px-4 pt-8 pb-16">
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gold-600/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-ember-500/8 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* headline */}
      <div className="relative z-20 text-center mb-8 max-w-2xl mx-auto">
        <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-4 animate-fade-up">Pune · Hospitality Influencer Marketplace</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold text-sand-50 leading-[1.05] text-balance animate-fade-up">
          Where <span className="gold-text">Restaurants</span> Meet<br />
          <span className="italic font-medium text-gold-200">the right creators</span>
        </h1>
        <p className="text-sand-400 mx-auto mt-5 text-sm md:text-base animate-fade-up max-w-lg">
          Direct, commission-free collaborations between Pune's finest dining venues and verified hospitality influencers.
        </p>
      </div>

      {/* pincode selector */}
      <div className="relative z-20 mb-8 flex items-center gap-2 bg-ink-800/80 border border-gold-700/30 rounded-full px-5 py-2.5 backdrop-blur">
        <MapPin className="w-4 h-4 text-gold-400 shrink-0" />
        <span className="text-sand-400 text-xs font-medium hidden sm:inline">Featured in</span>
        <select
          value={pincode}
          onChange={e => { setPincode(e.target.value); setCenterIdx(0); }}
          className="bg-transparent text-sand-100 text-sm font-semibold outline-none cursor-pointer"
        >
          <option value="all" className="bg-ink-800">All Pune</option>
          <option value="411017" className="bg-ink-800">411017 · Kalewadi</option>
          <option value="411057" className="bg-ink-800">411057 · Wakad</option>
          <option value="411045" className="bg-ink-800">411045 · Baner</option>
        </select>
      </div>

      {/* 3D coverflow */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-center gap-2 md:gap-4 mb-10 perspective-1000 min-h-[420px]">
        {/* nav arrows */}
        <button
          onClick={() => setCenterIdx(i => Math.max(0, i - 1))}
          disabled={centerIdx === 0}
          className="absolute left-0 md:left-4 z-30 w-11 h-11 rounded-full glass-dark border border-gold-600/40 flex items-center justify-center text-gold-300 hover:bg-gold-600/20 transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {visible.map((c) => {
          const offset = slides.indexOf(c) - centerIdx;
          const absOff = Math.abs(offset);
          if (absOff > 2) return null;
          const isCenter = offset === 0;
          const rotateY = offset * -22;
          const translateZ = isCenter ? 60 : -absOff * 60;
          const translateX = offset * 180;
          const scale = isCenter ? 1 : 0.82 - absOff * 0.04;
          const opacity = absOff > 1 ? 0.4 : 1 - absOff * 0.15;
          return (
            <div
              key={c.id}
              onClick={() => { if (!isCenter) setCenterIdx(slides.indexOf(c)); else onViewPortfolio(c); }}
              className="preserve-3d transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
              style={{
                transform: `perspective(1200px) rotateY(${rotateY}deg) translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
                opacity,
                zIndex: isCenter ? 30 : 10,
              }}
            >
              <div className={`relative w-[240px] md:w-[280px] h-[380px] md:h-[440px] rounded-3xl overflow-hidden shadow-glow-lg ${isCenter ? 'ring-2 ring-gold-500' : 'ring-1 ring-ink-700'}`}>
                <img
                  src={CREATOR_HERO_IMG[c.id] ?? c.img}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                {/* category tag */}
                <div className="absolute top-4 left-4">
                  <span className="glass-dark text-gold-300 text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">{c.subcategory}</span>
                </div>
                {/* pincode badge */}
                <div className="absolute top-4 right-4 glass-dark text-sand-100 text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-gold-400" /> {c.pincode}
                </div>
                {/* bottom content */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-3 mb-3 glass-dark rounded-2xl p-3 border border-gold-600/30">
                    <img src={c.img} alt={c.name} className="w-11 h-11 rounded-full object-cover border-2 border-gold-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-sand-50 flex items-center gap-1 truncate">
                        {c.name}
                        {c.verified && <BadgeCheck className="w-4 h-4 text-gold-400 shrink-0" />}
                      </p>
                      <p className="text-gold-300 text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" /> {c.followers} followers
                      </p>
                    </div>
                  </div>
                  {isCenter && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewPortfolio(c); }}
                      className="w-full bg-gold-500 text-ink-950 font-semibold text-sm py-3 rounded-full hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
                    >
                      View Portfolio <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setCenterIdx(i => Math.min(slides.length - 1, i + 1))}
          disabled={centerIdx >= slides.length - 1}
          className="absolute right-0 md:right-4 z-30 w-11 h-11 rounded-full glass-dark border border-gold-600/40 flex items-center justify-center text-gold-300 hover:bg-gold-600/20 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* dot indicators */}
      <div className="relative z-20 flex items-center gap-1.5 mb-8">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCenterIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === centerIdx ? 'w-7 bg-gold-500' : 'w-1.5 bg-ink-600 hover:bg-gold-700'}`}
          />
        ))}
      </div>

      {/* CTA buttons */}
      <div className="relative z-20 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => setView('explore')}
          className="bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 font-semibold text-sm px-8 py-3.5 rounded-full hover:shadow-glow transition-shadow flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Explore All Creators
        </button>
        <button
          onClick={() => setView('login')}
          className="border border-gold-600/50 text-gold-300 font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-gold-600/10 transition-colors"
        >
          Join Free as Brand or Creator
        </button>
      </div>

      {/* trust badge */}
      <div className="relative z-20 mt-10 flex items-center gap-3 px-6 py-3 rounded-full glass-dark border border-gold-700/30">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />)}
        </div>
        <span className="text-sand-200 text-sm font-medium">KR✓LAB Verified · 320+ Pune Partners</span>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 2 — BRAND BANNERS
// ─────────────────────────────────────────────────────────────

function Section2Banners({ setView }: { setView: (v: ViewMode) => void }) {
  return (
    <section className="bg-ink-950 py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal-700 via-royal-600 to-royal-800 p-10 min-h-[340px] flex flex-col justify-between">
          <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full bg-royal-500/30 blur-3xl" />
          <div className="relative z-10">
            <p className="text-blue-200 text-xs tracking-[0.3em] uppercase mb-3">For Creators</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight text-balance">They could be looking for someone like you</h2>
            <p className="text-blue-100/80 mt-3 text-sm">Pune's top resto-bars are searching for verified hospitality influencers right now.</p>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-6">
            <div className="flex -space-x-3">
              {AVATARS.map((a, i) => <img key={i} src={a} alt="" className="w-10 h-10 rounded-full border-2 border-royal-700 object-cover" loading="lazy" />)}
            </div>
            <button onClick={() => setView('login')} className="bg-white text-royal-700 font-semibold text-sm px-6 py-3 rounded-full hover:bg-blue-50 transition-colors flex items-center gap-2">
              Join Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ember-600 via-ember-500 to-ember-700 p-10 min-h-[340px] flex flex-col justify-between">
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-ember-400/30 blur-3xl" />
          <div className="relative z-10">
            <p className="text-orange-100 text-xs tracking-[0.3em] uppercase mb-3">For Brands & Venues</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight text-balance">Manage your creators and campaigns in-platform</h2>
            <p className="text-orange-100/80 mt-3 text-sm">Unlock direct contacts, verified rate cards, and a full campaign dashboard.</p>
          </div>
          <div className="relative z-10 flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-white">
              <Crown className="w-6 h-6" />
              <span className="text-sm font-medium">Pro Pass from ₹599/wk</span>
            </div>
            <button onClick={() => setView('pricing')} className="bg-ink-950 text-ember-400 font-semibold text-sm px-6 py-3 rounded-full hover:bg-ink-800 transition-colors flex items-center gap-2">
              Get Pro Pass <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// REFERENCE CREATOR CARD (frosted glass pill overlay)
// ─────────────────────────────────────────────────────────────

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = platform === 'instagram' ? Instagram : platform === 'facebook' ? Facebook : Youtube;
  return <Icon className={className} />;
}

function CreatorCard({ c, onClick }: { c: Creator; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group rounded-2xl overflow-hidden border border-ink-600 bg-ink-800 hover:border-gold-600/50 transition-all duration-300 cursor-pointer">
      {/* portrait image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
        {/* platform icon top-left */}
        <div className="absolute top-3 left-3 glass-dark w-9 h-9 rounded-full flex items-center justify-center">
          <PlatformIcon platform={c.platform} className="w-4 h-4 text-gold-300" />
        </div>
        {/* verified badge */}
        {c.verified && (
          <div className="absolute top-3 right-3 glass-dark w-9 h-9 rounded-full flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 text-gold-400" />
          </div>
        )}
        {/* frosted glass pill overlay at bottom */}
        <div className="absolute bottom-3 left-3 right-3 glass-dark rounded-2xl p-3 border border-gold-600/30 flex items-center gap-3">
          <img src={c.img} alt={c.name} className="w-11 h-11 rounded-full object-cover border-2 border-gold-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-sand-50 truncate">{c.name}</p>
            <p className="text-gold-300 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" /> {c.followers} followers
            </p>
          </div>
        </div>
      </div>
      {/* below card: platform + price + bio */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sand-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <PlatformIcon platform={c.platform} className="w-3.5 h-3.5 text-gold-500" />
            {c.platform === 'instagram' ? 'Instagram' : c.platform === 'facebook' ? 'Facebook' : 'YouTube'}
          </span>
          <span className="text-gold-300 font-bold text-lg">{c.rate}</span>
        </div>
        <p className="text-sand-400 text-xs leading-relaxed line-clamp-2">{c.subcategory} · {c.area}, {c.pincode}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 3 — FEATURED CREATORS BY CATEGORY (4 cards + pincode filter + explore more)
// ─────────────────────────────────────────────────────────────

function FeaturedCreatorSection({
  title, subtitle, subcategory, onViewPortfolio, onExploreMore,
}: {
  title: string;
  subtitle: string;
  subcategory: string;
  onViewPortfolio: (c: Creator) => void;
  onExploreMore: () => void;
}) {
  const [pincode, setPincode] = useState('all');
  const filtered = useMemo(() => {
    const list = CREATORS.filter(c => c.subcategory === subcategory);
    return pincode === 'all' ? list : list.filter(c => c.pincode === pincode);
  }, [subcategory, pincode]);

  const display = filtered.slice(0, 4);

  return (
    <section className="py-20 px-6 bg-ink-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-2">{subtitle}</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-sand-50">Featured {title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-ink-800 border border-ink-600 rounded-full px-4 py-2">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <select value={pincode} onChange={e => setPincode(e.target.value)} className="bg-transparent text-sand-100 text-sm outline-none cursor-pointer">
                <option value="all" className="bg-ink-800">All Pincodes</option>
                <option value="411017" className="bg-ink-800">411017 · Kalewadi</option>
                <option value="411057" className="bg-ink-800">411057 · Wakad</option>
                <option value="411045" className="bg-ink-800">411045 · Baner</option>
              </select>
            </div>
            <button onClick={onExploreMore} className="flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200 transition-colors whitespace-nowrap">
              Explore More <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {display.length === 0 ? (
          <div className="rounded-2xl border border-ink-600 bg-ink-800 p-10 text-center">
            <p className="text-sand-400 text-sm">No {title.toLowerCase()} in this pincode yet. Try All Pincodes.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {display.map(c => (
              <CreatorCard key={c.id} c={c} onClick={() => onViewPortfolio(c)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 4 — REEL SHOWCASE (dark band)
// ─────────────────────────────────────────────────────────────

function SectionReelShowcase({ onViewPortfolio }: { onViewPortfolio: (c: Creator) => void }) {
  const [activeReel, setActiveReel] = useState<number | null>(null);
  return (
    <section className="bg-gradient-to-b from-ink-900 to-ink-950 py-20 px-6 border-y border-gold-700/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3">Featured Video Reels</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-sand-50">Engage audiences with stunning videos</h2>
        </div>
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x snap-mandatory">
          {REELS.map((r) => (
            <div
              key={r.id}
              onClick={() => setActiveReel(r.id)}
              className="group relative shrink-0 w-[200px] md:w-[240px] h-[360px] md:h-[420px] rounded-t-[100px] rounded-b-3xl overflow-hidden cursor-pointer snap-center shadow-card"
            >
              <img src={r.img} alt={r.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="glass-dark text-gold-300 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Video className="w-3 h-3" /> {r.tag}
                </span>
                <span className="glass-dark text-sand-100 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {r.views}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <div className="w-12 h-12 rounded-full bg-gold-500/90 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-ink-950 fill-ink-950 ml-0.5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-sand-50">{r.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeReel !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={() => setActiveReel(null)}>
          <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <img src={REELS.find(r => r.id === activeReel)?.img} alt="" className="w-full h-[600px] object-cover rounded-t-[80px] rounded-b-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent rounded-t-[80px] rounded-b-3xl flex items-end p-6">
              <div>
                <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center mb-3">
                  <Play className="w-7 h-7 text-ink-950 fill-ink-950 ml-1" />
                </div>
                <h3 className="font-display text-xl text-sand-50">{REELS.find(r => r.id === activeReel)?.title}</h3>
                <p className="text-sand-400 text-sm flex items-center gap-1 mt-1"><Eye className="w-3 h-3" /> {REELS.find(r => r.id === activeReel)?.views} views</p>
              </div>
            </div>
            <button onClick={() => setActiveReel(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-ink-700 border border-gold-600/40 flex items-center justify-center text-sand-200 hover:bg-ink-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 5 — HOW IT WORKS
// ─────────────────────────────────────────────────────────────

const STEPS = [
  { icon: UserPlus, title: 'Create Account', desc: 'Sign up free as a brand or creator in under 60 seconds.' },
  { icon: Briefcase, title: 'Complete Profile', desc: 'Add your venue or portfolio, pincode, and rate card.' },
  { icon: Search, title: 'Find Brand / Creator', desc: 'Filter by platform, category, and hyper-local pincode.' },
  { icon: Handshake, title: 'Collaborate Direct', desc: 'Unlock contacts and close deals via WhatsApp — no middleman.' },
];

function SectionHowItWorks() {
  return (
    <section className="bg-sand-100 py-24 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-gold-700 text-xs tracking-[0.3em] uppercase mb-3">How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-900 mb-8">Four steps to your next collab</h2>
          <div className="grid grid-cols-2 gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="group bg-sand-50 rounded-2xl p-6 border border-sand-300 hover:border-gold-500 hover:shadow-card transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-gold-100 flex items-center justify-center mb-4 group-hover:bg-gold-500 transition-colors">
                    <Icon className="w-5 h-5 text-gold-700 group-hover:text-ink-950 transition-colors" strokeWidth={1.5} />
                  </div>
                  <span className="text-gold-600 text-xs font-bold tracking-wider">STEP {i + 1}</span>
                  <h3 className="font-display text-xl font-bold text-ink-900 mt-1">{s.title}</h3>
                  <p className="text-ink-600 text-sm mt-2 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <img src={COLLAGE[0]} alt="Fine dining" className="w-full h-56 object-cover rounded-2xl shadow-card" loading="lazy" />
            <img src={COLLAGE[1]} alt="Cocktail craft" className="w-full h-40 object-cover rounded-2xl shadow-card" loading="lazy" />
          </div>
          <div className="space-y-4 mt-10">
            <img src={COLLAGE[2]} alt="Celebration" className="w-full h-40 object-cover rounded-2xl shadow-card" loading="lazy" />
            <img src={COLLAGE[3]} alt="Gourmet plating" className="w-full h-56 object-cover rounded-2xl shadow-card" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 6 — TESTIMONIALS
// ─────────────────────────────────────────────────────────────

function SectionTestimonials() {
  return (
    <section className="bg-sand-100 py-24 px-6 border-t border-sand-200">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-700 text-xs tracking-[0.3em] uppercase mb-3">Hospitality ROI</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink-900">Loved by Pune's finest</h2>
          <p className="text-ink-600 mt-3 text-sm">Real results from real venue owners and creators.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-sand-50 rounded-2xl p-7 border border-sand-300 shadow-sm hover:shadow-card transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-gold-500 text-gold-500" />)}
              </div>
              <p className="text-ink-700 leading-relaxed text-sm italic mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-gold-400" loading="lazy" />
                <div>
                  <p className="font-display font-bold text-ink-900 flex items-center gap-1.5">{t.name} <BadgeCheck className="w-4 h-4 text-gold-600" /></p>
                  <p className="text-ink-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION 7 — PRICING
// ─────────────────────────────────────────────────────────────

function SectionPricing({ onUnlockPro, setView }: { onUnlockPro: () => void; setView: (v: ViewMode) => void }) {
  const [modal, setModal] = useState<typeof PRICING[number] | null>(null);
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');

  const handleVerify = () => {
    if (utr.length !== 12 || !/^\d{12}$/.test(utr)) {
      setUtrError('Please enter a valid 12-digit UTR / UPI Reference number.');
      return;
    }
    onUnlockPro();
    setModal(null);
    setUtr('');
    setUtrError('');
  };

  return (
    <section id="pricing" className="bg-ink-950 py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-3">Membership</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-sand-50">Choose your access</h2>
          <p className="text-sand-400 mt-3 text-sm">No hidden fees. No commission. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRICING.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.tier}
                className={`relative rounded-2xl p-6 flex flex-col ${p.highlight ? 'bg-gradient-to-b from-gold-600/20 to-ink-800 border-2 border-gold-500 shadow-glow scale-105' : 'bg-ink-800 border border-ink-600'}`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-ink-950 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Most Popular</span>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${p.highlight ? 'bg-gold-500 text-ink-950' : 'bg-ink-700 text-gold-400'}`}>
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-bold text-sand-50">{p.tier}</h3>
                <p className={`text-xs mb-4 ${p.highlight ? 'text-gold-300' : 'text-sand-500'}`}>{p.tagline}</p>
                <div className="mb-5">
                  <span className="font-display text-3xl font-bold gold-text">{p.price}</span>
                  <span className="text-sand-400 text-sm"> {p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-sand-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${p.highlight ? 'text-gold-400' : 'text-gold-600'}`} /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (p.tier === 'Creator Account') setView('login');
                    else if (p.tier === 'Free Brand') setView('login');
                    else setModal(p);
                  }}
                  className={`w-full py-3 rounded-full font-semibold text-sm transition-all ${p.highlight ? 'bg-gold-500 text-ink-950 hover:bg-gold-400' : 'border border-gold-600/50 text-gold-300 hover:bg-gold-600/10'}`}
                >
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4" onClick={() => { setModal(null); setUtr(''); setUtrError(''); }}>
          <div className="bg-ink-800 rounded-3xl border border-gold-600/40 p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-sand-50">{modal.tier}</h3>
                <p className="text-gold-300 text-sm">{modal.price} {modal.period}</p>
              </div>
              <button onClick={() => { setModal(null); setUtr(''); setUtrError(''); }} className="text-sand-400 hover:text-sand-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-white rounded-2xl p-6 flex items-center justify-center mb-5">
              <div className="w-48 h-48 grid grid-cols-12 grid-rows-12 gap-0.5">
                {[...Array(144)].map((_, i) => {
                  const seed = (i * 7 + 13) % 11;
                  const corner = (i < 3 || i > 140 || (i % 12) < 3 || (i % 12) > 8);
                  return <div key={i} className={`${seed > 5 || corner ? 'bg-ink-950' : 'bg-white'} rounded-[1px]`} />;
                })}
              </div>
            </div>
            <div className="text-center mb-5">
              <p className="text-sand-400 text-xs mb-1">Pay via UPI to</p>
              <p className="font-display text-lg font-bold gold-text">support@krolab.in</p>
            </div>
            <div className="mb-4">
              <label className="text-sand-400 text-xs mb-1.5 block">Enter 12-digit UPI Reference / UTR Number</label>
              <input
                type="text"
                value={utr}
                onChange={e => { setUtr(e.target.value); setUtrError(''); }}
                placeholder="e.g. 384756102934"
                maxLength={12}
                className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 placeholder:text-sand-600"
              />
              {utrError && <p className="text-red-400 text-xs mt-1.5">{utrError}</p>}
            </div>
            <button
              onClick={handleVerify}
              className="w-full bg-gold-500 text-ink-950 font-semibold py-3 rounded-full hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Verify & Unlock Pro Now
            </button>
            <p className="text-sand-500 text-xs text-center mt-3">Enter your bank UTR to instantly unlock all creator contacts.</p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────

function Footer({ setView }: { setView: (v: ViewMode) => void }) {
  const go = (v: ViewMode) => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <footer className="bg-ink-950 pt-20 px-6 border-t border-gold-700/10">
      {/* trust seal */}
      <div className="max-w-md mx-auto text-center mb-16">
        <div className="inline-flex flex-col items-center gap-4 px-10 py-8 rounded-3xl border-2 border-gold-500 bg-gradient-to-b from-gold-600/10 to-transparent shadow-glow">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold-500/20 blur-2xl" />
            <ShieldCheck className="w-16 h-16 text-gold-400 relative z-10" strokeWidth={1} />
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold gold-text">KROLAB Verified</h3>
            <p className="text-sand-400 text-sm mt-1">Hospitality Seal of Trust</p>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />)}
          </div>
          <p className="text-sand-500 text-xs max-w-xs">Every listed creator and venue is manually vetted for authentic engagement and real Pune presence.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-ink-700 py-12 grid md:grid-cols-5 gap-8">
        <div>
          <div className="flex items-center gap-1 mb-4">
            <span className="font-display text-xl font-bold gold-text">KR</span>
            <Check className="w-3 h-3 text-gold-500" strokeWidth={3} />
            <span className="font-display text-xl font-bold gold-text">LAB</span>
            <span className="text-sand-500 text-xs ml-1">.IN</span>
          </div>
          <p className="text-sand-500 text-sm leading-relaxed">Pune's exclusive hospitality influencer marketplace. Direct, commission-free, verified.</p>
        </div>
        <div>
          <h4 className="text-sand-200 font-semibold text-sm mb-4">Categories</h4>
          <ul className="space-y-2 text-sm text-sand-500">
            <li><button onClick={() => go('food_influencers')} className="hover:text-gold-300 transition-colors">Food Influencers</button></li>
            <li><button onClick={() => go('reel_makers')} className="hover:text-gold-300 transition-colors">Reel Makers</button></li>
            <li><button onClick={() => go('digital_marketers')} className="hover:text-gold-300 transition-colors">Digital Marketers</button></li>
            <li><button onClick={() => go('explore')} className="hover:text-gold-300 transition-colors">Explore All</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sand-200 font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-sand-500">
            <li><button onClick={() => go('about')} className="hover:text-gold-300 transition-colors">About Us</button></li>
            <li><button onClick={() => go('contact')} className="hover:text-gold-300 transition-colors">Contact Us</button></li>
            <li><button onClick={() => go('pricing')} className="hover:text-gold-300 transition-colors">Pricing</button></li>
            <li><button onClick={() => go('login')} className="hover:text-gold-300 transition-colors">Login / Sign Up</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sand-200 font-semibold text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-sand-500">
            <li><button onClick={() => go('privacy')} className="hover:text-gold-300 transition-colors">Privacy Policy</button></li>
            <li><button onClick={() => go('terms')} className="hover:text-gold-300 transition-colors">Terms & Conditions</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sand-200 font-semibold text-sm mb-4">Get in Touch</h4>
          <ul className="space-y-2.5 text-sm text-sand-500">
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gold-400" /> 8750481256</li>
            <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gold-400" /> support@krolab.in</li>
            <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold-400" /> Kalewadi, Pune</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-700 py-6 text-center">
        <p className="text-sand-600 text-xs">© 2026 KROLAB.IN · Kalewadi, Pune · All rights reserved · Made for Pune's hospitality community</p>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPLORE / CATEGORY PAGES
// ─────────────────────────────────────────────────────────────

const EXPLORE_CATEGORIES = ['All', 'Restaurants', 'Cafes', 'Pubs', 'Cloud Kitchens'];
const EXPLORE_SUBCATEGORIES = ['All', 'Food Influencer', 'Reel Maker', 'Digital Marketer', 'Freelance Marketing Agent'];
const PUNE_CITIES = ['All', 'Pune'];
const FOLLOWER_BANDS = [
  { value: 'all', label: 'Any followers' },
  { value: '0-200', label: 'Under 200K' },
  { value: '200-500', label: '200K – 500K' },
  { value: '500-1000', label: '500K – 1M' },
  { value: '1000+', label: 'Above 1M' },
];

function followerCount(s: string): number {
  const n = parseFloat(s);
  return s.includes('M') ? n * 1000 : n;
}

function ExplorePage({ title, lockedSub, onViewPortfolio, setView }: { title: string; lockedSub: string | null; onViewPortfolio: (c: Creator) => void; setView: (v: ViewMode) => void }) {
  const [fCity, setFCity] = useState('All');
  const [fPincode, setFPincode] = useState('');
  const [fCategory, setFCategory] = useState('All');
  const [fSubcategory, setFSubcategory] = useState('All');
  const [fPlatform, setFPlatform] = useState('all');
  const [fGender, setFGender] = useState('all');
  const [fFollowerBand, setFFollowerBand] = useState('all');
  const [fMinPrice, setFMinPrice] = useState('');
  const [fMaxPrice, setFMaxPrice] = useState('');
  const [fSort, setFSort] = useState('followers-high');

  const filtered = useMemo(() => {
    let list = CREATORS.filter(c => {
      if (lockedSub && c.subcategory !== lockedSub) return false;
      if (fPincode && c.pincode !== fPincode) return false;
      if (fCategory !== 'All' && c.category !== fCategory) return false;
      if (fSubcategory !== 'All' && c.subcategory !== fSubcategory) return false;
      if (fPlatform !== 'all' && c.platform !== fPlatform) return false;
      if (fGender !== 'all' && c.gender !== fGender) return false;
      const fc = followerCount(c.followers);
      if (fFollowerBand === '0-200' && fc >= 200) return false;
      if (fFollowerBand === '200-500' && (fc < 200 || fc >= 500)) return false;
      if (fFollowerBand === '500-1000' && (fc < 500 || fc >= 1000)) return false;
      if (fFollowerBand === '1000+' && fc < 1000) return false;
      const rate = parseFloat(c.rate.replace(/[^\d]/g, ''));
      if (fMinPrice && rate < parseFloat(fMinPrice)) return false;
      if (fMaxPrice && rate > parseFloat(fMaxPrice)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const af = followerCount(a.followers);
      const bf = followerCount(b.followers);
      if (fSort === 'price-low') return parseFloat(a.rate.replace(/[^\d]/g, '')) - parseFloat(b.rate.replace(/[^\d]/g, ''));
      if (fSort === 'price-high') return parseFloat(b.rate.replace(/[^\d]/g, '')) - parseFloat(a.rate.replace(/[^\d]/g, ''));
      if (fSort === 'followers-low') return af - bf;
      if (fSort === 'rating-low') return a.rating - b.rating;
      if (fSort === 'rating-high') return b.rating - a.rating;
      return bf - af;
    });
    return list;
  }, [lockedSub, fPincode, fCategory, fSubcategory, fPlatform, fGender, fFollowerBand, fMinPrice, fMaxPrice, fSort]);

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <h1 className="font-display text-4xl md:text-5xl font-bold gold-text mb-2">{title}</h1>
        <p className="text-sand-400 text-sm mb-8">Pune's verified hospitality talent — filter by pincode, platform, category, price, and more.</p>

        {/* filter bar */}
        <div className="glass-dark rounded-2xl border border-gold-700/20 p-4 mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mr-2">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <select value={fCity} onChange={e => setFCity(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            {PUNE_CITIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
          </select>
          <input type="text" placeholder="Pincode (e.g. 411017)" value={fPincode} onChange={e => setFPincode(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 w-40" />
          <select value={fCategory} onChange={e => setFCategory(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            {EXPLORE_CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <select value={fSubcategory} onChange={e => setFSubcategory(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            {EXPLORE_SUBCATEGORIES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subcategories' : s}</option>)}
          </select>
          <select value={fPlatform} onChange={e => setFPlatform(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
          </select>
          <select value={fGender} onChange={e => setFGender(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select value={fFollowerBand} onChange={e => setFFollowerBand(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
            {FOLLOWER_BANDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-sand-500 text-xs">₹</span>
            <input type="number" min="0" placeholder="Min" value={fMinPrice} onChange={e => setFMinPrice(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-3 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 w-20" />
            <span className="text-sand-500 text-xs">–</span>
            <input type="number" min="0" placeholder="Max" value={fMaxPrice} onChange={e => setFMaxPrice(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-3 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 w-20" />
          </div>
          <select value={fSort} onChange={e => setFSort(e.target.value)} className="bg-ink-800 text-sand-100 text-sm px-4 py-2 rounded-lg outline-none border border-ink-600 focus:border-gold-600 cursor-pointer ml-auto">
            <option value="followers-high">Followers: High to Low</option>
            <option value="followers-low">Followers: Low to High</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating-high">Rating: High to Low</option>
            <option value="rating-low">Rating: Low to High</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-ink-600 bg-ink-800 p-12 text-center">
            <p className="text-sand-400">No creators match these filters. Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <CreatorCard key={c.id} c={c} onClick={() => onViewPortfolio(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN / SIGNUP / FORGOT PASSWORD VIEW
// ─────────────────────────────────────────────────────────────

function AuthView({ setView, onAuthed }: { setView: (v: ViewMode) => void; onAuthed: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'Brand' | 'Creator'>('Brand');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (mode === 'forgot') {
      setInfo('Password reset link sent to ' + email + ' (demo mode — check console in production).');
      return;
    }
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (mode === 'register') {
      if (!fullName) { setError('Full name is required.'); return; }
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (!acceptTerms) { setError('Please accept the Terms & Conditions.'); return; }
    }
    setBusy(true);
    try {
      let user: AuthUser;
      if (mode === 'login') {
        user = await authService.signIn(email, password);
      } else {
        const role: AuthRole = accountType === 'Creator' ? 'creator' : 'free_brand';
        user = await authService.signUp(email, password, fullName || email.split('@')[0], role, { phone });
      }
      onAuthed(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const demoFill = async (role: AuthRole, emailAddr: string, name: string) => {
    setBusy(true);
    setError(null);
    try {
      const user = await authService.signIn(emailAddr, 'demo1234');
      onAuthed({ ...user, role, fullName: name, email: emailAddr });
    } catch {
      try {
        const u = await authService.signUp(emailAddr, 'demo1234', name, role, { phone: '8750481256' });
        onAuthed(u);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Demo login failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-16">
      <div className="absolute top-6 left-6">
        <button onClick={() => setView('home')} className="flex items-center gap-1">
          <span className="font-display text-xl font-bold gold-text tracking-wider">KR</span>
          <Check className="w-3 h-3 text-gold-500" strokeWidth={3} />
          <span className="font-display text-xl font-bold gold-text tracking-wider">LAB</span>
          <span className="text-sand-500 text-xs ml-0.5">.IN</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="glass-dark rounded-3xl border border-gold-700/30 p-8 shadow-glow-lg">
          {/* tabs */}
          <div className="flex bg-ink-800 rounded-full p-1 border border-ink-600 mb-6">
            {(['login', 'register', 'forgot'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setMode(t); setError(null); setInfo(null); }}
                className={`flex-1 text-xs font-semibold py-2.5 rounded-full transition-all capitalize ${mode === t ? 'bg-gold-500 text-ink-950' : 'text-sand-400 hover:text-sand-200'}`}
              >
                {t === 'login' ? 'Login' : t === 'register' ? 'Sign Up' : 'Forgot'}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold text-sand-50 mb-1">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset your password'}
          </h2>
          <p className="text-sand-500 text-sm mb-6">
            {mode === 'login' ? 'Sign in to your KROLAB account' : mode === 'register' ? 'Join Pune\'s hospitality marketplace' : 'Enter your email to receive a reset link'}
          </p>

          <div className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                  className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
              </div>
            )}
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
                className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Contact Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …"
                  className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
              </div>
            )}
            {mode === 'register' && (
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Brand', 'Creator'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setAccountType(t)}
                      className={`text-sm font-semibold py-3 rounded-xl border transition-all ${accountType === t ? 'bg-gold-500 text-ink-950 border-gold-500' : 'bg-ink-900 text-sand-300 border-ink-600 hover:border-gold-600'}`}
                    >
                      {t === 'Brand' ? <Building2 className="w-4 h-4 inline mr-1.5" /> : <Clapperboard className="w-4 h-4 inline mr-1.5" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode !== 'forgot' && (
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
              </div>
            )}
            {mode === 'register' && (
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                  className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
              </div>
            )}
            {mode === 'register' && (
              <label className="flex items-start gap-2 text-sand-400 text-xs cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-gold-500" />
                <span>I accept the <button onClick={() => setView('terms')} className="text-gold-300 underline">Terms & Conditions</button> and <button onClick={() => setView('privacy')} className="text-gold-300 underline">Privacy Policy</button>.</span>
              </label>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {info && <p className="text-green-400 text-xs">{info}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 font-semibold py-3.5 rounded-full hover:shadow-glow transition-shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>

            {mode !== 'forgot' && (
              <>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-ink-600" />
                  <span className="text-sand-500 text-xs">or</span>
                  <div className="flex-1 h-px bg-ink-600" />
                </div>
                <button
                  onClick={() => setError('Google sign-in requires a configured Google OAuth provider. Use demo quick-fill below to preview.')}
                  className="w-full bg-white text-ink-800 font-semibold py-3 rounded-full hover:bg-sand-100 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Globe className="w-4 h-4" /> Continue with Google
                </button>
              </>
            )}
          </div>

          {/* demo quick-fill — subtle, for testing only */}
          {mode === 'login' && (
            <div className="mt-6 pt-4 border-t border-dashed border-ink-600">
              <p className="text-sand-600 text-[10px] uppercase tracking-wider mb-2 text-center">Demo Quick-Fill (testing only)</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => demoFill('free_brand', 'brand@krolab.in', 'Demo Brand')} disabled={busy} className="text-[11px] font-semibold py-2 px-2 rounded-lg bg-ink-800 text-sand-300 border border-ink-600 hover:border-gold-600 transition-colors disabled:opacity-50">Free Brand</button>
                <button onClick={() => demoFill('pro_brand', 'pro@krolab.in', 'Pro Brand')} disabled={busy} className="text-[11px] font-semibold py-2 px-2 rounded-lg bg-ink-800 text-gold-300 border border-gold-600/40 hover:border-gold-500 transition-colors disabled:opacity-50">Pro Brand</button>
                <button onClick={() => demoFill('creator', 'creator@krolab.in', 'Demo Creator')} disabled={busy} className="text-[11px] font-semibold py-2 px-2 rounded-lg bg-ink-800 text-sand-300 border border-ink-600 hover:border-gold-600 transition-colors disabled:opacity-50">Creator</button>
                <button onClick={() => demoFill('admin', 'support@krolab.in', 'KROLAB Admin')} disabled={busy} className="text-[11px] font-semibold py-2 px-2 rounded-lg bg-ink-800 text-gold-300 border border-gold-600/40 hover:border-gold-500 transition-colors disabled:opacity-50">Admin</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIMPLE STATIC PAGES (About, Contact, Privacy, Terms)
// ─────────────────────────────────────────────────────────────

function SimplePage({ title, children, setView }: { title: string; children: React.ReactNode; setView: (v: ViewMode) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <h1 className="font-display text-4xl md:text-5xl font-bold gold-text mb-8">{title}</h1>
        <div className="prose prose-invert max-w-none text-sand-300 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND HUB VIEW
// ─────────────────────────────────────────────────────────────

function BrandHubView({ user, onExit }: { user: AuthUser | null; onExit: () => void }) {
  const BRAND_TYPES = ['Hotel', 'Restaurant', 'Pub', 'Resort', 'Cloud Kitchen', 'Food Stall', 'Others'];
  const [brandName, setBrandName] = useState(user?.venueName ?? user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('Kalewadi, Pune, Maharashtra');
  const [brandType, setBrandType] = useState('Restaurant');
  const [venueImages, setVenueImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      brandHubService.getBrandProfile(user.id).then(p => {
        if (!p) return;
        setBrandName(p.venueName ?? p.fullName ?? '');
        setPhone(p.phone ?? '');
        if (p.address) setAddress(p.address);
        if (p.brandType) setBrandType(p.brandType);
        if (p.venueImages?.length) setVenueImages(p.venueImages);
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (user?.id) {
        await brandHubService.saveBrandProfile(user.id, { brandName, phone, address, brandType, venueImages });
      }
      setSavedAt(new Date().toLocaleTimeString());
      telemetry.logActivity({
        actorId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        activityType: 'brand_profile_update',
        meta: { brandName, brandType, address },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addImage = () => {
    const url = prompt('Paste venue image URL (https://…)')?.trim();
    if (url) setVenueImages(prev => [...prev, url].slice(0, 6));
  };

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold gold-text">Brand Profile & Campaign Dashboard</h1>
          <p className="text-sand-400 text-sm mt-2">Manage your brand identity. Editable anytime. Required to launch campaigns and receive creator enquiries.</p>
        </header>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          <div className="glass-dark rounded-2xl border border-gold-700/20 p-6 space-y-5">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-gold-400" /> Brand Details</h2>
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Brand Name</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. The Sunset Bistro"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Contact Number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …"
                  className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
              </div>
              <div>
                <label className="text-sand-400 text-xs font-medium mb-1.5 block">Brand Type</label>
                <select value={brandType} onChange={e => setBrandType(e.target.value)}
                  className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
                  {BRAND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Full venue address"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 resize-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sand-400 text-xs font-medium">Optional Venue Images</label>
                <button onClick={addImage} className="text-xs text-gold-300 flex items-center gap-1 hover:text-gold-200">
                  <Plus className="w-3.5 h-3.5" /> Add image
                </button>
              </div>
              {venueImages.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-ink-600 p-6 text-center text-sand-500 text-sm">
                  No venue images yet. Click "Add image" to paste image URLs.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {venueImages.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={img} alt={`Venue ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      <button onClick={() => setVenueImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-950/80 text-sand-100 flex items-center justify-center hover:bg-red-500/80 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 font-semibold px-6 py-3 rounded-full hover:shadow-glow transition-shadow flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Brand Profile'}
              </button>
              {savedAt && !error && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved at {savedAt}</span>}
              {error && <span className="text-red-400 text-xs">{error}</span>}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass-dark rounded-2xl border border-gold-700/20 p-5">
              <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-gold-400" /> Membership</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-sand-400">Current tier</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-xs ${user?.role === 'pro_brand' ? 'bg-gold-500/20 text-gold-300 border border-gold-600/40' : 'bg-ink-800 text-sand-400 border border-ink-600'}`}>
                  {user?.role === 'pro_brand' ? 'Pro Brand' : 'Free Brand'}
                </span>
              </div>
              <p className="text-xs text-sand-500 mt-3">
                {user?.role === 'pro_brand' ? 'Pro active. Direct contacts, WhatsApp, and enquiries unlocked.' : 'Free tier: browse only. Upgrade to unlock creator contacts and direct enquiries.'}
              </p>
            </div>
            <div className="glass-dark rounded-2xl border border-gold-700/20 p-5">
              <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-gold-400" /> Campaigns</h3>
              <p className="text-xs text-sand-500 mb-3">Launch a campaign from your brand profile to receive creator pitches.</p>
              <button onClick={() => telemetry.logActivity({ actorId: user?.id ?? null, actorEmail: user?.email ?? null, activityType: 'campaign_intent', meta: { brandName } })}
                className="w-full bg-ink-800 text-gold-300 border border-gold-600/40 text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-700 transition flex items-center justify-center gap-2">
                <Sparkle className="w-4 h-4" /> New Campaign (Coming Soon)
              </button>
            </div>
            <div className="glass-dark rounded-2xl border border-gold-700/20 p-5">
              <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-gold-400" /> KROLAB Support</h3>
              <p className="text-xs text-sand-400">Need help with your profile or Pro upgrade?</p>
              <a href="tel:8750481256" className="text-gold-300 text-sm font-semibold mt-2 block">8750481256</a>
              <a href="mailto:support@krolab.in" className="text-gold-300 text-sm font-semibold block">support@krolab.in</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATOR STUDIO VIEW
// ─────────────────────────────────────────────────────────────

function CreatorStudioView({ user, onExit }: { user: AuthUser | null; onExit: () => void }) {
  const CREATOR_TYPES = ['Food Influencer', 'Reel Maker', 'Digital Marketer', 'Freelance Marketing Agent'];
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [creatorType, setCreatorType] = useState('Food Influencer');
  const [igHandle, setIgHandle] = useState('');
  const [igFollowers, setIgFollowers] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={onExit} className="flex items-center gap-2 text-sm font-semibold text-gold-300 hover:text-gold-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold gold-text">Creator Studio</h1>
          <p className="text-sand-400 text-sm mt-2">Build your designer media-kit portfolio. Free to register and edit anytime.</p>
        </header>

        <div className="glass-dark rounded-2xl border border-gold-700/20 p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Contact Number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 …"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
          </div>
          <div>
            <label className="text-sand-400 text-xs font-medium mb-1.5 block">Creator Type</label>
            <select value={creatorType} onChange={e => setCreatorType(e.target.value)}
              className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 cursor-pointer">
              {CREATOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Instagram ID</label>
              <input value={igHandle} onChange={e => setIgHandle(e.target.value)} placeholder="@yourhandle"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
            <div>
              <label className="text-sand-400 text-xs font-medium mb-1.5 block">Instagram Followers</label>
              <input value={igFollowers} onChange={e => setIgFollowers(e.target.value)} placeholder="e.g. 248K"
                className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600" />
            </div>
          </div>
          <div>
            <label className="text-sand-400 text-xs font-medium mb-1.5 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Short creator bio"
              className="w-full bg-ink-800 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 resize-none" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => {
                setSaving(true);
                telemetry.logActivity({ actorId: user?.id ?? null, actorEmail: user?.email ?? null, activityType: 'creator_profile_update', meta: { fullName, creatorType } });
                setTimeout(() => { setSaving(false); setSavedAt(new Date().toLocaleTimeString()); }, 600);
              }}
              disabled={saving}
              className="bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 font-semibold px-6 py-3 rounded-full hover:shadow-glow transition-shadow flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
            {savedAt && <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved at {savedAt}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CREATOR PORTFOLIO VIEW (Designer Media-Kit)
// ─────────────────────────────────────────────────────────────

function UpiQrModal({ open, onClose, onVerified, tierLabel, price }: {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  tierLabel: string;
  price: string;
}) {
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;
  const handleVerify = async () => {
    if (!/^\d{12}$/.test(utr)) { setError('Enter a valid 12-digit UTR / UPI Reference number.'); return; }
    setSubmitting(true);
    const amount = tierLabel.includes('Monthly') ? 1499 : 599;
    try {
      await upiService.submit({ brandName: '', brandPhone: '', planTier: tierLabel, amount, utrNumber: utr });
      onVerified();
      setUtr(''); setError('');
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/90 p-4" onClick={onClose}>
      <div className="bg-ink-800 rounded-3xl border border-gold-600/40 p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-xl font-bold text-sand-50">{tierLabel}</h3>
            <p className="text-gold-300 text-sm">{price}</p>
          </div>
          <button onClick={onClose} className="text-sand-400 hover:text-sand-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-white rounded-2xl p-6 flex items-center justify-center mb-5">
          <div className="w-48 h-48 grid grid-cols-12 grid-rows-12 gap-0.5">
            {[...Array(144)].map((_, i) => {
              const seed = (i * 7 + 13) % 11;
              const corner = (i < 3 || i > 140 || (i % 12) < 3 || (i % 12) > 8);
              return <div key={i} className={`${seed > 5 || corner ? 'bg-ink-950' : 'bg-white'} rounded-[1px]`} />;
            })}
          </div>
        </div>
        <div className="text-center mb-5">
          <p className="text-sand-400 text-xs mb-1">Pay via UPI to</p>
          <p className="font-display text-lg font-bold gold-text">support@krolab.in</p>
        </div>
        <div className="mb-4">
          <label className="text-sand-400 text-xs mb-1.5 block">Enter 12-digit UPI Reference / UTR Number</label>
          <input type="text" value={utr} onChange={e => { setUtr(e.target.value); setError(''); }} placeholder="e.g. 384756102934" maxLength={12}
            className="w-full bg-ink-900 text-sand-100 text-sm px-4 py-3 rounded-xl outline-none border border-ink-600 focus:border-gold-600 placeholder:text-sand-600" />
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </div>
        <button onClick={handleVerify} disabled={submitting} className="w-full bg-gold-500 text-ink-950 font-semibold py-3 rounded-full hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {submitting ? 'Submitting…' : 'Verify & Unlock Pro Now'}
        </button>
        <p className="text-sand-500 text-xs text-center mt-3">Enter your bank UTR — it enters the admin verification queue and unlocks Pro once approved.</p>
      </div>
    </div>
  );
}

function CreatorPortfolioView({
  creator, userRole, onBack, onUnlockPro,
}: {
  creator: Creator;
  userRole: UserRole;
  onBack: () => void;
  onUnlockPro: () => void;
}) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [coverMode, setCoverMode] = useState<'still' | 'video'>('still');
  const [activeTheater, setActiveTheater] = useState<number | null>(null);
  const [showUpi, setShowUpi] = useState(false);
  const [editData, setEditData] = useState<CreatorProfile>(buildProfile(creator));

  useEffect(() => { setEditData(buildProfile(creator)); }, [creator]);

  const isDark = theme === 'dark';
  const isLocked = userRole === 'free_brand';
  const isOwner = userRole === 'creator_owner' || userRole === 'creator';
  const isPro = userRole === 'pro_brand';

  const bg = isDark ? 'bg-ink-950 text-sand-50' : 'bg-sand-100 text-ink-900';
  const cardBg = isDark ? 'bg-ink-800 border-ink-600' : 'bg-sand-50 border-sand-300';
  const mutedText = isDark ? 'text-sand-400' : 'text-ink-600';
  const subCardBg = isDark ? 'bg-ink-700' : 'bg-sand-200';
  const accentText = isDark ? 'text-gold-300' : 'text-gold-700';
  const inputBg = isDark ? 'bg-ink-900 border-ink-600 text-sand-100' : 'bg-white border-sand-300 text-ink-900';

  const rateNum = parseFloat(editData.rate.replace(/[^\d.]/g, ''));
  const packages = [
    { name: 'Single Reel Package', desc: '1 Instagram Reel + 3 Stories (On-site table visit + raw footage)', price: editData.rate },
    { name: 'Full Tasting Combo', desc: '1 Reel + FB Food Group Post + YT Short', price: `₹${Math.round(rateNum * 1.8).toLocaleString('en-IN')}` },
    { name: 'Monthly Resto-Bar Retainer', desc: '4 Weekend Reels + Menu Launch Host', price: `₹${Math.round(rateNum * 4).toLocaleString('en-IN')}` },
  ];

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-500`}>
      {/* top action bar */}
      <div className={`sticky top-16 z-40 ${isDark ? 'bg-ink-950/90' : 'bg-sand-100/90'} backdrop-blur-xl border-b ${isDark ? 'border-gold-700/20' : 'border-sand-300'} px-4 py-3 flex flex-wrap items-center justify-between gap-3`}>
        <button onClick={onBack} className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all ${isDark ? 'bg-ink-800 text-gold-300 border border-gold-600/40 hover:bg-ink-700' : 'bg-white text-ink-900 border border-sand-300 hover:border-gold-500'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 rounded-full p-1 border ${isDark ? 'bg-ink-800 border-ink-600' : 'bg-white border-sand-300'}`}>
            <button onClick={() => setTheme('light')} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${!isDark ? 'bg-gold-500 text-ink-950' : 'text-sand-400'}`}>
              <Sun className="w-3.5 h-3.5" /> Warm Editorial
            </button>
            <button onClick={() => setTheme('dark')} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${isDark ? 'bg-gold-500 text-ink-950' : 'text-ink-500'}`}>
              <Moon className="w-3.5 h-3.5" /> Dark Cinema
            </button>
          </div>
          <div className={`flex items-center gap-1 rounded-full p-1 border ${isDark ? 'bg-ink-800 border-ink-600' : 'bg-white border-sand-300'}`}>
            <button onClick={() => setCoverMode('still')} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${coverMode === 'still' ? 'bg-gold-500 text-ink-950' : isDark ? 'text-sand-400' : 'text-ink-500'}`}>
              <ImageIcon className="w-3.5 h-3.5" /> Still
            </button>
            <button onClick={() => setCoverMode('video')} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${coverMode === 'video' ? 'bg-gold-500 text-ink-950' : isDark ? 'text-sand-400' : 'text-ink-500'}`}>
              <Film className="w-3.5 h-3.5" /> Video Reel
            </button>
          </div>
        </div>
      </div>

      {/* full-bleed cover header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ink-900 via-ink-950 to-gold-900/40 min-h-[420px] flex items-end pb-20">
        <img src={editData.img.replace('h=400&w=400', 'h=600&w=1200')} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" loading="lazy" />
        {coverMode === 'video' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-transparent" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-600/20 blur-3xl animate-float" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-ember-500/15 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>
            <div className="absolute top-6 left-6 flex items-center gap-2 glass-dark px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sand-100 text-xs font-medium">Ambient Reel Cover · Now Playing</span>
            </div>
          </>
        )}
        {coverMode === 'still' && <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />}

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="flex items-end gap-5">
              <img src={editData.img} alt={editData.name} className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-gold-500 shadow-glow-lg" loading="lazy" />
              <div className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-500/15 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> AVAILABLE FOR TABLE SHOOTS
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gold-300 text-xs bg-gold-900/40 border border-gold-700/40 px-3 py-1 rounded-full">{editData.category}</span>
                  <span className="text-sand-200 text-xs flex items-center gap-1 bg-ink-800/60 px-3 py-1 rounded-full"><MapPin className="w-3 h-3" /> {editData.area} · {editData.pincode}</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-sand-50 flex items-center gap-2">
                  {editData.name}
                  {editData.verified && <BadgeCheck className="w-7 h-7 text-gold-400" />}
                </h1>
                <p className="text-sand-300 text-sm md:text-base max-w-md mt-1">{editData.bio}</p>
              </div>
            </div>
            <div className="md:ml-auto glass-dark rounded-2xl border border-gold-600/40 px-6 py-4 text-right">
              <p className="text-sand-400 text-xs">Starting Collaboration Rate</p>
              <p className="font-display text-3xl font-bold gold-text">{editData.rate} <span className="text-sm text-sand-400">/ deliverable</span></p>
              <p className="text-gold-300 text-xs flex items-center gap-1 justify-end mt-1">
                <Star className="w-3 h-3 fill-gold-400 text-gold-400" /> {editData.rating} (244 Verified Venue Reviews)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5-metric bento bar */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Instagram, label: 'Instagram Reach', value: `${editData.followers} Followers`, sub: editData.igHandle },
            { icon: Facebook, label: 'Facebook Page', value: '42K Followers', sub: 'Pune Food Group' },
            { icon: Youtube, label: 'YouTube Channel', value: '28K Subscribers', sub: 'Shorts & Vlogs' },
            { icon: Eye, label: 'Avg Views / Reel', value: '85,400 / post', sub: '✓ 100% Organic Local' },
            { icon: TrendingUp, label: 'Engagement Rate', value: '6.4% Verified', sub: 'High Table Conversion', highlight: true },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className={`rounded-2xl p-4 border ${m.highlight ? 'bg-gradient-to-b from-gold-600/20 to-transparent border-gold-500 shadow-glow' : isDark ? 'bg-ink-800 border-ink-600' : 'bg-sand-50 border-sand-300'}`}>
                <Icon className={`w-5 h-5 mb-2 ${m.highlight ? 'text-gold-400' : accentText}`} strokeWidth={1.5} />
                <p className={`text-xs ${mutedText}`}>{m.label}</p>
                <p className={`font-display text-sm font-bold mt-0.5 ${isDark ? 'text-sand-50' : 'text-ink-900'} ${isLocked && i === 0 ? 'blur-sm select-none' : ''}`}>{m.value}</p>
                <p className={`text-xs mt-0.5 ${m.highlight ? 'text-gold-300' : mutedText}`}>{m.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* two-column layout */}
      <div className="max-w-6xl mx-auto px-6 mt-12 grid lg:grid-cols-[65%_33%] gap-6 items-start">
        <div className="space-y-10">
          <div>
            <h2 className={`font-display text-2xl font-bold mb-1 ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Featured Hospitality Work</h2>
            <p className={`text-sm mb-5 ${mutedText}`}>5 vertical 9:16 reels · click to open video theater</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PORTFOLIO_REELS.map(r => (
                <div key={r.id} onClick={() => setActiveTheater(r.id)} className="group relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer shadow-card">
                  <img src={r.img} alt={r.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                  <span className="absolute top-2 right-2 glass-dark text-sand-100 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {r.views}</span>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Play className="w-4 h-4 text-ink-950 fill-ink-950 ml-0.5" /></div>
                    <p className="text-sand-50 text-[11px] font-medium leading-tight">{r.title}</p>
                    <p className="text-gold-300 text-[10px] mt-0.5">{r.pincode}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`font-display text-2xl font-bold mb-1 ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Hospitality Shoot & Food Styling</h2>
            <p className={`text-sm mb-5 ${mutedText}`}>Asymmetric bento gallery</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[140px]">
              {GALLERY_SHOTS.map((g, i) => (
                <div key={i} className={`group relative rounded-2xl overflow-hidden shadow-card ${g.span}`}>
                  <img src={g.img} alt={g.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                  <p className="absolute bottom-2 left-3 text-sand-50 text-xs font-medium">{g.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`font-display text-2xl font-bold mb-1 ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Hyper-Local Pune Audience Density</h2>
            <p className={`text-sm mb-5 ${mutedText}`}>Where this creator's followers dine</p>
            <div className="space-y-4">
              {AUDIENCE_BARS.map(b => (
                <div key={b.pincode}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm flex items-center gap-1.5 ${isDark ? 'text-sand-200' : 'text-ink-700'}`}><MapPin className="w-3.5 h-3.5 text-gold-500" /> {b.pincode} · {b.area}</span>
                    <span className="text-sm font-bold text-gold-500">{b.pct}%</span>
                  </div>
                  <div className={`h-3 rounded-full overflow-hidden ${subCardBg}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-700 transition-all duration-1000" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* sticky deal vault */}
        <div className="lg:sticky lg:top-32 space-y-5">
          <div className={`rounded-2xl p-5 border ${cardBg}`}>
            <h3 className={`font-display text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-sand-50' : 'text-ink-900'}`}><Sparkle className="w-4 h-4 text-gold-500" /> Transparent Packages</h3>
            <div className="space-y-3">
              {packages.map((p, i) => (
                <div key={i} className={`rounded-xl p-4 ${subCardBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-semibold text-sm ${isDark ? 'text-sand-100' : 'text-ink-800'}`}>{p.name}</p>
                    <p className="font-bold text-gold-500 text-sm">{p.price}</p>
                  </div>
                  <p className={`text-xs ${mutedText}`}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl p-5 border ${cardBg}`}>
            {isLocked && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-display text-lg font-bold ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Direct Contact Vault</h3>
                  <span className="text-[10px] font-bold bg-ink-700 text-sand-400 px-2.5 py-1 rounded-full">LOCKED (FREE MODE)</span>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { icon: Phone, label: 'Phone', value: '+91 98234 56789' },
                    { icon: MessageCircle, label: 'WhatsApp', value: 'wa.me/919823456789' },
                    { icon: Instagram, label: 'Instagram', value: editData.igHandle },
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${subCardBg}`}>
                        <Icon className="w-4 h-4 text-gold-500 shrink-0" />
                        <div className="flex-1">
                          <p className={`text-xs ${mutedText}`}>{c.label}</p>
                          <p className={`text-sm font-medium blur-sm select-none ${isDark ? 'text-sand-200' : 'text-ink-800'}`}>{c.value}</p>
                        </div>
                        <Lock className="w-4 h-4 text-sand-500" />
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setShowUpi(true)} className="w-full bg-gradient-to-r from-gold-500 to-gold-700 text-ink-950 font-semibold py-3 rounded-full hover:shadow-glow transition-shadow flex items-center justify-center gap-2 mb-4">
                  <Zap className="w-4 h-4" /> Unlock Direct Contact — ₹599/wk (UPI QR)
                </button>
                <div className={`rounded-xl p-4 ${subCardBg}`}>
                  <p className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-sand-200' : 'text-ink-700'}`}><Send className="w-3.5 h-3.5 text-gold-500" /> Send Query to KROLAB Admin</p>
                  <div className="space-y-2">
                    <input placeholder="Venue Name" className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                    <input placeholder="Pincode" className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                    <div className="flex gap-2">
                      <input placeholder="Budget ₹" className={`w-1/2 text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                      <input placeholder="Date" className={`w-1/2 text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                    </div>
                    <button className={`w-full text-sm font-semibold py-2 rounded-lg ${isDark ? 'bg-ink-600 text-gold-300 hover:bg-ink-500' : 'bg-sand-300 text-ink-800 hover:bg-sand-400'} transition-colors`}>Submit Query</button>
                  </div>
                </div>
              </>
            )}

            {isPro && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-display text-lg font-bold ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Direct Contact Vault</h3>
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> PRO UNLOCKED (0% COMMISSION)</span>
                </div>
                <div className="space-y-3 mb-5">
                  {[
                    { icon: Phone, label: 'Phone', value: editData.phone },
                    { icon: MessageCircle, label: 'WhatsApp', value: `wa.me/${editData.whatsapp}` },
                    { icon: Instagram, label: 'Instagram', value: editData.igHandle },
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className={`flex items-center gap-3 rounded-xl p-3 ${subCardBg}`}>
                        <Icon className="w-4 h-4 text-gold-500 shrink-0" />
                        <div className="flex-1">
                          <p className={`text-xs ${mutedText}`}>{c.label}</p>
                          <p className={`text-sm font-medium ${isDark ? 'text-sand-100' : 'text-ink-800'}`}>{c.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <a href={`https://wa.me/918750481256?text=Hi%20${encodeURIComponent(editData.name)},%20I'd%20like%20to%20discuss%20a%20table%20shoot%20collaboration%20via%20KROLAB`} target="_blank" rel="noopener noreferrer"
                  onClick={() => telemetry.logActivity({ targetProfileId: String(creator.id), targetName: creator.name, activityType: 'whatsapp_click', meta: { platform: creator.platform } })}
                  className="w-full bg-green-600 text-white font-semibold py-3 rounded-full hover:bg-green-500 transition-colors flex items-center justify-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" /> Chat Directly on WhatsApp
                </a>
                <a href={`tel:${editData.phone.replace(/\s/g, '')}`}
                  onClick={() => telemetry.logActivity({ targetProfileId: String(creator.id), targetName: creator.name, activityType: 'phone_click', meta: { platform: creator.platform } })}
                  className={`w-full font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2 mb-4 ${isDark ? 'bg-ink-700 text-gold-300 hover:bg-ink-600' : 'bg-sand-200 text-ink-800 hover:bg-sand-300'}`}>
                  <Phone className="w-4 h-4" /> Call Creator Direct
                </a>
                <div className={`rounded-xl p-4 ${subCardBg}`}>
                  <p className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-sand-200' : 'text-ink-700'}`}><Send className="w-3.5 h-3.5 text-gold-500" /> Send Direct Table Shoot Invite</p>
                  <div className="space-y-2">
                    <input placeholder="Venue Name" className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                    <div className="flex gap-2">
                      <input placeholder="Date" className={`w-1/2 text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                      <input placeholder="Budget ₹" className={`w-1/2 text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500`} />
                    </div>
                    <textarea placeholder="Shoot brief / menu details..." rows={2} className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} placeholder:text-sand-500 resize-none`} />
                    <button className="w-full bg-gold-500 text-ink-950 text-sm font-semibold py-2 rounded-lg hover:bg-gold-400 transition-colors">Send Invite</button>
                  </div>
                </div>
              </>
            )}

            {isOwner && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-display text-lg font-bold ${isDark ? 'text-sand-50' : 'text-ink-900'}`}>Live Portfolio Editor</h3>
                  <span className="text-[10px] font-bold bg-gold-500/20 text-gold-400 px-2.5 py-1 rounded-full flex items-center gap-1"><Pencil className="w-3 h-3" /> EDIT MODE</span>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'category', label: 'Category' },
                    { key: 'pincode', label: 'Pincode' },
                    { key: 'area', label: 'Area' },
                    { key: 'followers', label: 'Followers' },
                    { key: 'rate', label: 'Starting Rate' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={`text-xs ${mutedText} mb-1 block`}>{f.label}</label>
                      <input value={(editData as unknown as Record<string, string>)[f.key]} onChange={e => setEditData(d => ({ ...d, [f.key]: e.target.value }))} className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg}`} />
                    </div>
                  ))}
                  <div>
                    <label className={`text-xs ${mutedText} mb-1 block`}>Bio</label>
                    <textarea value={editData.bio} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} rows={3} className={`w-full text-sm px-3 py-2 rounded-lg outline-none border ${inputBg} resize-none`} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <UpiQrModal open={showUpi} onClose={() => setShowUpi(false)} onVerified={() => { onUnlockPro(); setShowUpi(false); }} tierLabel="Pro Weekly Pass" price="₹599 / week" />

      {activeTheater !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/95 p-4" onClick={() => setActiveTheater(null)}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <img src={PORTFOLIO_REELS.find(r => r.id === activeTheater)?.img} alt="" className="w-full h-[600px] object-cover rounded-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent rounded-3xl flex items-end p-6">
              <div>
                <div className="w-16 h-16 rounded-full bg-gold-500 flex items-center justify-center mb-3"><Play className="w-7 h-7 text-ink-950 fill-ink-950 ml-1" /></div>
                <h3 className="font-display text-xl text-sand-50">{PORTFOLIO_REELS.find(r => r.id === activeTheater)?.title}</h3>
                <p className="text-gold-300 text-sm mt-1">{PORTFOLIO_REELS.find(r => r.id === activeTheater)?.dish}</p>
                <div className="flex items-center gap-4 mt-2 text-sand-300 text-xs">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {PORTFOLIO_REELS.find(r => r.id === activeTheater)?.views} views</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400" /> {PORTFOLIO_REELS.find(r => r.id === activeTheater)?.conversions}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveTheater(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-ink-700 border border-gold-600/40 flex items-center justify-center text-sand-200 hover:bg-ink-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedCreator, setSelectedCreator] = useState<Creator>(CREATORS[0]);
  const [user, setUser] = useState<AuthUser | null>(null);

  // restore session on mount
  useEffect(() => {
    authService.getCurrentUser().then(u => {
      if (u) setUser(u);
    }).catch(() => {});
  }, []);

  const goHome = () => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const setView = (v: ViewMode) => { setCurrentView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const goToPortfolio = (c: Creator) => {
    setSelectedCreator(c);
    setCurrentView('portfolio');
    telemetry.logActivity({
      actorEmail: user?.email ?? null,
      actorId: user?.id ?? null,
      targetProfileId: String(c.id),
      targetName: c.name,
      activityType: 'profile_view',
      meta: { category: c.category, platform: c.platform },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onAuthed = (u: AuthUser) => {
    setUser(u);
    // route based on role
    if (u.role === 'admin') setCurrentView('admin_control_room');
    else if (u.role === 'creator') setCurrentView('creator_onboarding');
    else setCurrentView('brand_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onLogout = async () => {
    await authService.signOut();
    setUser(null);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onUnlockPro = () => {
    setUser(u => u ? { ...u, role: 'pro_brand' } : u);
  };

  const isAdmin = user?.role === 'admin';

  // role for portfolio view: derive from logged-in user, fallback to free_brand
  const portfolioRole: UserRole = user
    ? (user.role === 'admin' ? 'free_brand' : (user.role as UserRole))
    : 'free_brand';

  return (
    <div className="min-h-screen bg-ink-950">
      {/* public nav header — shown on all views except login (login has its own minimal logo) */}
      {currentView !== 'login' && (
        <PublicHeader
          currentView={currentView}
          setView={setView}
          user={user}
          isAdmin={isAdmin}
          onLogout={onLogout}
        />
      )}

      {currentView === 'home' && (
        <>
          <Section1Hero onViewPortfolio={goToPortfolio} setView={setView} />
          <Section2Banners setView={setView} />
          <FeaturedCreatorSection title="Reel Makers" subtitle="Cinematic Storytellers" subcategory="Reel Maker" onViewPortfolio={goToPortfolio} onExploreMore={() => setView('reel_makers')} />
          <SectionReelShowcase onViewPortfolio={goToPortfolio} />
          <FeaturedCreatorSection title="Food Influencers" subtitle="Tastemakers" subcategory="Food Influencer" onViewPortfolio={goToPortfolio} onExploreMore={() => setView('food_influencers')} />
          <FeaturedCreatorSection title="Digital Marketers" subtitle="Growth Specialists" subcategory="Digital Marketer" onViewPortfolio={goToPortfolio} onExploreMore={() => setView('digital_marketers')} />
          <SectionHowItWorks />
          <SectionTestimonials />
          <SectionPricing onUnlockPro={onUnlockPro} setView={setView} />
          <Footer setView={setView} />
        </>
      )}

      {currentView === 'explore' && (
        <ExplorePage title="Explore All Creators" lockedSub={null} onViewPortfolio={goToPortfolio} setView={setView} />
      )}
      {currentView === 'food_influencers' && (
        <ExplorePage title="Food Influencers" lockedSub="Food Influencer" onViewPortfolio={goToPortfolio} setView={setView} />
      )}
      {currentView === 'reel_makers' && (
        <ExplorePage title="Reel Makers" lockedSub="Reel Maker" onViewPortfolio={goToPortfolio} setView={setView} />
      )}
      {currentView === 'digital_marketers' && (
        <ExplorePage title="Digital Marketers" lockedSub="Digital Marketer" onViewPortfolio={goToPortfolio} setView={setView} />
      )}

      {currentView === 'pricing' && (
        <>
          <div className="pt-8">
            <SectionPricing onUnlockPro={onUnlockPro} setView={setView} />
          </div>
          <Footer setView={setView} />
        </>
      )}

      {currentView === 'about' && (
        <SimplePage title="About KROLAB.IN" setView={setView}>
          <p>KROLAB.IN is Pune's exclusive hospitality influencer marketplace — a direct, commission-free platform connecting the city's finest dining venues with verified hospitality creators.</p>
          <p>Founded in Kalewadi, Pune, we built KROLAB to eliminate the middleman. Restaurants, cafés, pubs, and cloud kitchens no longer need to pay agency markups of 30-50% to find the right food influencer, reel maker, or digital marketer. Every creator on KROLAB is manually vetted for authentic local engagement and real Pune presence.</p>
          <p>Our hyper-local pincode matching means a Baner resto-bar finds a Baner-based creator, a Wakad café finds a Wakad food influencer — all within a 5-10km radius. Direct WhatsApp, direct calls, zero commission.</p>
          <p>Whether you're a brand looking for your next collaboration or a creator looking for your next gig, KROLAB is free to join. Brands unlock direct contacts with a Pro Pass starting at ₹599/week. Creators keep 100% of what they earn — we take zero commission.</p>
        </SimplePage>
      )}

      {currentView === 'contact' && (
        <SimplePage title="Contact Us" setView={setView}>
          <p>We're here to help. Reach out for anything — brand support, creator onboarding, Pro upgrades, or partnership enquiries.</p>
          <div className="space-y-3 not-prose">
            <div className="flex items-center gap-3 glass-dark rounded-xl p-4 border border-gold-700/20">
              <Phone className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-sand-400 text-xs">Phone</p>
                <a href="tel:8750481256" className="text-sand-100 font-semibold">8750481256</a>
              </div>
            </div>
            <div className="flex items-center gap-3 glass-dark rounded-xl p-4 border border-gold-700/20">
              <Mail className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-sand-400 text-xs">Email</p>
                <a href="mailto:support@krolab.in" className="text-sand-100 font-semibold">support@krolab.in</a>
              </div>
            </div>
            <div className="flex items-center gap-3 glass-dark rounded-xl p-4 border border-gold-700/20">
              <MapPin className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-sand-400 text-xs">Address</p>
                <p className="text-sand-100 font-semibold">Kalewadi, Pune, Maharashtra</p>
              </div>
            </div>
          </div>
        </SimplePage>
      )}

      {currentView === 'privacy' && (
        <SimplePage title="Privacy Policy" setView={setView}>
          <p>KROLAB.IN respects your privacy. We collect only the information necessary to operate the marketplace: your name, email, contact number, and account type (brand or creator).</p>
          <p>We do not sell your data to third parties. Your contact details are only visible to Pro-tier brand accounts when you list as a creator. Your UTR/UPI reference numbers are used solely for payment verification and are stored securely.</p>
          <p>Profile activity (views, contact clicks) is logged for analytics and admin moderation. We use Supabase for secure data storage with row-level security policies enforcing that users can only access their own data.</p>
          <p>You may request deletion of your account and associated data at any time by contacting support@krolab.in.</p>
        </SimplePage>
      )}

      {currentView === 'terms' && (
        <SimplePage title="Terms & Conditions" setView={setView}>
          <p>By using KROLAB.IN, you agree to these terms. KROLAB is a marketplace platform facilitating direct connections between hospitality brands and content creators in Pune.</p>
          <p>KROLAB takes zero commission on creator earnings. Brands pay a subscription fee (₹599/week or ₹1499/month) to unlock direct contact details. All payments are verified via UTR/UPI reference numbers before Pro access is granted.</p>
          <p>Creators are responsible for the accuracy of their portfolio data (follower counts, rate cards, location). KROLAB reserves the right to verify or remove listings that misrepresent engagement or location.</p>
          <p>Brands and creators transact directly off-platform. KROLAB is not liable for the outcome of collaborations, payments, or deliverables arranged through the platform. Disputes should be resolved between the parties.</p>
          <p>Abuse of the platform — spam, fake accounts, harassment — may result in account suspension without refund.</p>
        </SimplePage>
      )}

      {currentView === 'login' && (
        <AuthView setView={setView} onAuthed={onAuthed} />
      )}

      {currentView === 'admin_control_room' && isAdmin && (
        <AdminControlRoom onExit={goHome} />
      )}
      {currentView === 'admin_control_room' && !isAdmin && (
        <div className="min-h-screen flex items-center justify-center bg-ink-950 text-center px-4">
          <div>
            <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-sand-50 mb-2">Access Denied</h1>
            <p className="text-sand-400 text-sm mb-6">You need admin privileges to access the Control Room.</p>
            <button onClick={goHome} className="bg-gold-500 text-ink-950 font-semibold px-6 py-3 rounded-full hover:bg-gold-400 transition-colors">Back to Home</button>
          </div>
        </div>
      )}

      {currentView === 'brand_dashboard' && user && (user.role === 'free_brand' || user.role === 'pro_brand') && (
        <BrandHubView user={user} onExit={goHome} />
      )}

      {currentView === 'creator_onboarding' && user && user.role === 'creator' && (
        <CreatorStudioView user={user} onExit={goHome} />
      )}

      {currentView === 'portfolio' && (
        <CreatorPortfolioView
          creator={selectedCreator}
          userRole={portfolioRole}
          onBack={goHome}
          onUnlockPro={onUnlockPro}
        />
      )}
    </div>
  );
}
