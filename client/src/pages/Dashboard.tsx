import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, DollarSign, Package, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import api from '../api/axios';
import AdminLayout from '../layouts/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalRevenue: number;
  packageBreakdown: { package_name: string; count: string }[];
}

// ── Stat card config ──────────────────────────────────────────────────────────
const cards = (s: Stats) => [
  {
    label: 'Total Users',
    value: s.totalUsers,
    icon: Users,
    gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    glow: 'rgba(99,102,241,0.35)',
    border: 'rgba(99,102,241,0.3)',
    bg: 'rgba(99,102,241,0.08)',
    sub: 'All registered customers',
    trend: null,
  },
  {
    label: 'Active Users',
    value: s.activeUsers,
    icon: UserCheck,
    gradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
    glow: 'rgba(16,185,129,0.35)',
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.08)',
    sub: s.totalUsers > 0 ? `${Math.round((s.activeUsers / s.totalUsers) * 100)}% of total` : '—',
    trend: s.totalUsers > 0 ? Math.round((s.activeUsers / s.totalUsers) * 100) : 0,
  },
  {
    label: 'Suspended',
    value: s.suspendedUsers,
    icon: UserX,
    gradient: 'linear-gradient(135deg,#ef4444,#f97316)',
    glow: 'rgba(239,68,68,0.35)',
    border: 'rgba(239,68,68,0.3)',
    bg: 'rgba(239,68,68,0.08)',
    sub: 'Restricted accounts',
    trend: null,
  },
  {
    label: 'Active Revenue',
    value: `$${s.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    icon: DollarSign,
    gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',
    glow: 'rgba(245,158,11,0.35)',
    border: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.08)',
    sub: 'From active subscriptions',
    trend: null,
  },
];

const pkgAccent: Record<string, { bar: string; badge: string; dot: string }> = {
  Basic:      { bar: 'linear-gradient(90deg,#64748b,#94a3b8)', badge: 'rgba(100,116,139,0.15)', dot: '#94a3b8' },
  Pro:        { bar: 'linear-gradient(90deg,#3b82f6,#6366f1)', badge: 'rgba(99,102,241,0.15)',  dot: '#818cf8' },
  Enterprise: { bar: 'linear-gradient(90deg,#8b5cf6,#a855f7)', badge: 'rgba(139,92,246,0.15)', dot: '#a78bfa' },
  Starter:    { bar: 'linear-gradient(90deg,#10b981,#06b6d4)', badge: 'rgba(16,185,129,0.15)',  dot: '#34d399' },
};

function getPkgAccent(name: string) {
  if (!name) return pkgAccent.Basic;
  const n = name.toLowerCase();
  if (n.includes('enterprise')) return pkgAccent.Enterprise;
  if (n.includes('pro'))        return pkgAccent.Pro;
  if (n.includes('starter'))    return pkgAccent.Starter;
  return pkgAccent.Basic;
}

// ── Component ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { token, admin } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetch = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        if (res.data.success) setStats(res.data.stats);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview and key metrics">

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-400 text-sm">
          <svg className="animate-spin w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading dashboard…
        </div>
      ) : error ? (
        <div
          className="rounded-2xl px-5 py-4 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      ) : stats ? (
        <div className="space-y-6">

          {/* ── Welcome banner ──────────────────────────────────────────────── */}
          <div
            className="relative rounded-2xl px-6 py-5 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 50%, rgba(6,182,212,0.1) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(20px)' }} />
            <div className="absolute right-24 -bottom-6 w-24 h-24 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', filter: 'blur(16px)' }} />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-semibold tracking-widest uppercase">Admin Console</span>
                </div>
                <h2 className="text-white text-xl font-bold">
                  Welcome back, <span style={{ background: 'linear-gradient(90deg,#a5b4fc,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{admin?.name ?? 'Admin'}</span>
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">Here's what's happening on your platform today.</p>
              </div>
              <div
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-300"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <TrendingUp size={15} />
                Live data
              </div>
            </div>
          </div>

          {/* ── Stat cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards(stats).map(card => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    boxShadow: `0 0 0 0 ${card.glow}`,
                  }}
                >
                  {/* Corner glow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at top right, ${card.glow} 0%, transparent 60%)` }}
                  />

                  <div className="relative flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: card.gradient, boxShadow: `0 4px 14px ${card.glow}` }}
                    >
                      <Icon size={18} className="text-white" />
                    </div>
                    {card.trend !== null && (
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}
                      >
                        <ArrowUpRight size={11} />
                        {card.trend}%
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <p className="text-slate-400 text-xs mb-1 font-medium tracking-wide">{card.label}</p>
                    <p
                      className="text-3xl font-bold tracking-tight"
                      style={{ background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      {card.value}
                    </p>
                    <p className="text-slate-500 text-xs mt-1.5">{card.sub}</p>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${card.border}, transparent)` }}
                  />
                </div>
              );
            })}
          </div>

          {/* ── Bottom row ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Package breakdown — wider */}
            <div
              className="lg:col-span-3 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.35)' }}
                >
                  <Package size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-semibold">Package Breakdown</h2>
                  <p className="text-slate-500 text-xs">Subscriber distribution by plan</p>
                </div>
              </div>

              {stats.packageBreakdown.length === 0 ? (
                <p className="text-slate-500 text-sm">No package data available.</p>
              ) : (
                <div className="space-y-4">
                  {stats.packageBreakdown.map(pkg => {
                    const total = stats.packageBreakdown.reduce((a, b) => a + parseInt(b.count), 0);
                    const pct   = total > 0 ? Math.round((parseInt(pkg.count) / total) * 100) : 0;
                    const acc   = getPkgAccent(pkg.package_name);
                    return (
                      <div key={pkg.package_name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: acc.dot, boxShadow: `0 0 6px ${acc.dot}` }} />
                            <span
                              className="px-2 py-0.5 rounded-lg text-xs font-medium"
                              style={{ background: acc.badge, color: acc.dot, border: `1px solid ${acc.dot}22` }}
                            >
                              {pkg.package_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs">{pct}%</span>
                            <span className="text-white text-sm font-bold">{pkg.count}</span>
                            <span className="text-slate-500 text-xs">users</span>
                          </div>
                        </div>
                        {/* Bar track */}
                        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: acc.bar, boxShadow: `0 0 8px ${acc.dot}55` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform summary — narrower */}
            <div
              className="lg:col-span-2 rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow: '0 0 12px rgba(6,182,212,0.35)' }}
                >
                  <TrendingUp size={14} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-semibold">Platform Summary</h2>
                  <p className="text-slate-500 text-xs">Key performance indicators</p>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  {
                    label: 'Activation Rate',
                    value: stats.totalUsers > 0 ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` : '—',
                    color: '#34d399',
                    bg: 'rgba(16,185,129,0.1)',
                  },
                  {
                    label: 'Avg Revenue / User',
                    value: stats.activeUsers > 0 ? `$${(stats.totalRevenue / stats.activeUsers).toFixed(2)}` : '—',
                    color: '#fbbf24',
                    bg: 'rgba(245,158,11,0.1)',
                  },
                  {
                    label: 'Suspended Accounts',
                    value: String(stats.suspendedUsers),
                    color: '#f87171',
                    bg: 'rgba(239,68,68,0.1)',
                  },
                  {
                    label: 'Plan Tiers Active',
                    value: String(stats.packageBreakdown.length),
                    color: '#a78bfa',
                    bg: 'rgba(139,92,246,0.1)',
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-3 rounded-xl transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                  >
                    <span className="text-slate-400 text-sm">{item.label}</span>
                    <span
                      className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
                      style={{ color: item.color, background: item.bg }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </AdminLayout>
  );
};

export default Dashboard;
