import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Building2, Package, Users, Calendar,
  ShieldAlert, CheckCircle, XCircle, Clock, AlertTriangle,
  Plus, Trash2, UserCheck, UserX, RefreshCw, Layers,
  DollarSign, TimerReset,
} from 'lucide-react';
import api from '../api/axios';
import AdminLayout from '../layouts/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SubUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number | null;
  tenant_id: string | null;
  source: string | null;
  password_must_change: boolean;
  account_status: string;
  created_at: string;
  package_id: number | null;
  package_name: string | null;
  package_display_name: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  plan_type: string | null;
  purchase_date: string | null;
  computed_end_date: string | null;
  days_remaining: number | null;
  sub_user_stats: { total: number; active: number; inactive: number };
  package_details: { max_users: number | null; features: string[]; description: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

function subscriptionHealth(days: number | null): {
  color: string; bg: string; border: string; bar: string; label: string; icon: React.ReactNode;
} {
  if (days === null) return { color: 'text-slate-400', bg: 'bg-slate-700/30', border: 'border-slate-600/40', bar: 'bg-slate-500', label: 'Unknown', icon: <Clock size={14} /> };
  if (days < 0)      return { color: 'text-red-400',   bg: 'bg-red-500/10',    border: 'border-red-500/30',   bar: 'bg-red-500',   label: 'Expired',  icon: <XCircle size={14} /> };
  if (days <= 7)     return { color: 'text-red-400',   bg: 'bg-red-500/10',    border: 'border-red-500/30',   bar: 'bg-red-500',   label: 'Critical', icon: <AlertTriangle size={14} /> };
  if (days <= 30)    return { color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/30', bar: 'bg-amber-500', label: 'Expiring', icon: <AlertTriangle size={14} /> };
  return               { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500', label: 'Active', icon: <CheckCircle size={14} /> };
}

const statusConfig: Record<string, { color: string; border: string; icon: React.ReactNode }> = {
  active:    { color: 'text-emerald-400 bg-emerald-500/15', border: 'border-emerald-500/30', icon: <CheckCircle size={13} /> },
  suspended: { color: 'text-red-400 bg-red-500/15',         border: 'border-red-500/30',     icon: <XCircle size={13} /> },
  inactive:  { color: 'text-slate-400 bg-slate-600/30',     border: 'border-slate-600/40',   icon: <Clock size={13} /> },
};

const inputCls = 'w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section: React.FC<{ icon: React.ReactNode; title: string; accent?: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  icon, title, accent = 'text-blue-400', children, action,
}) => (
  <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
      <div className="flex items-center gap-2">
        <span className={accent}>{icon}</span>
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30 last:border-0">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className="text-white text-sm font-medium text-right">{children}</span>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  const [user, setUser] = useState<UserData | null>(null);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status modal
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Add sub-user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [subForm, setSubForm] = useState({ name: '', email: '', role: 'user', department: '' });
  const [subFormError, setSubFormError] = useState('');
  const [subSubmitting, setSubSubmitting] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get(`/api/admin/users/${id}`);
      if (res.data.success) setUser(res.data.user);
    } catch {
      setError('Failed to load user details.');
    }
  }, [id, token]);

  const fetchSubUsers = useCallback(async () => {
    try {
      const res = await api.get(`/api/admin/users/${id}/sub-users`);
      if (res.data.success) setSubUsers(res.data.sub_users);
    } catch {}
  }, [id, token]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUser(), fetchSubUsers()]).finally(() => setLoading(false));
  }, [fetchUser, fetchSubUsers]);

  // ── Status update ──────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    setStatusLoading(true);
    try {
      await api.put(`/api/admin/users/${id}/status`, { status: newStatus, reason: statusReason });
      setStatusModal(false);
      setStatusReason('');
      fetchUser();
    } catch { alert('Failed to update status.'); }
    finally { setStatusLoading(false); }
  };

  // ── Add sub user ───────────────────────────────────────────────────────────
  const handleAddSubUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubFormError('');
    if (!subForm.name.trim()) return setSubFormError('Name is required.');
    setSubSubmitting(true);
    try {
      await api.post(`/api/admin/users/${id}/sub-users`, subForm);
      setSubForm({ name: '', email: '', role: 'user', department: '' });
      setShowAddForm(false);
      await Promise.all([fetchUser(), fetchSubUsers()]);
    } catch (err: any) {
      setSubFormError(err.response?.data?.error || 'Failed to add user.');
    } finally { setSubSubmitting(false); }
  };

  // ── Toggle sub user ────────────────────────────────────────────────────────
  const toggleSubUser = async (subId: number) => {
    try {
      await api.patch(`/api/admin/sub-users/${subId}/toggle`, {});
      fetchSubUsers();
      fetchUser();
    } catch { alert('Failed to update sub user.'); }
  };

  // ── Delete sub user ────────────────────────────────────────────────────────
  const deleteSubUser = async (subId: number) => {
    if (!confirm('Remove this user from the system?')) return;
    try {
      await api.delete(`/api/admin/sub-users/${subId}`);
      await Promise.all([fetchUser(), fetchSubUsers()]);
    } catch { alert('Failed to remove sub user.'); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout title="User Detail">
        <div className="flex items-center justify-center h-64 text-slate-400 gap-2 text-sm">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading user...
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout title="User Detail">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">{error || 'User not found.'}</div>
      </AdminLayout>
    );
  }

  const sc  = statusConfig[user.account_status] ?? statusConfig.inactive;
  const sub = user.sub_user_stats;
  const pkg = user.package_details;
  const maxUsers = pkg?.max_users ?? null;
  const usedPct  = maxUsers ? Math.min(100, Math.round((sub.total / maxUsers) * 100)) : 0;
  const health   = subscriptionHealth(user.days_remaining);

  const totalDays = user.plan_type === 'monthly' ? 30 : 365;
  const daysUsed  = user.days_remaining !== null ? Math.max(0, totalDays - user.days_remaining) : 0;
  const timeUsedPct = Math.min(100, Math.round((daysUsed / totalDays) * 100));

  const activePlanPrice = user.plan_type === 'monthly'
    ? user.price_monthly
    : user.plan_type === 'yearly'
      ? user.price_yearly
      : (user.price_monthly ?? user.price_yearly);

  return (
    <AdminLayout title="User Detail" subtitle="Full system profile and subscription overview">
      {/* Back */}
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-500/20 flex items-center justify-center text-blue-300 text-2xl font-bold flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-white text-xl font-bold truncate">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.color} ${sc.border}`}>
                {sc.icon} {user.account_status}
              </span>
              {user.tenant_id && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/40">
                  <Building2 size={11} /> {user.tenant_id}
                </span>
              )}
              {user.package_display_name && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Package size={11} /> {user.package_display_name}
                </span>
              )}
              {user.password_must_change && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Must change password
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => { setNewStatus(user.account_status); setStatusModal(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all flex-shrink-0"
          >
            <ShieldAlert size={14} /> Manage Status
          </button>
        </div>

        {/* Quick stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/40">
          {[
            { label: 'Registered', value: fmt(user.created_at),                      icon: <Calendar size={13} /> },
            { label: 'Package',    value: user.package_display_name || '—',           icon: <Package size={13} /> },
            { label: 'Sub Users',  value: `${sub.total} / ${maxUsers ?? '∞'}`,        icon: <Users size={13} /> },
            { label: 'Days Left',
              value: user.days_remaining === null ? '—'
                   : user.days_remaining < 0 ? 'Expired'
                   : `${user.days_remaining} days`,
              icon: <TimerReset size={13} />,
            },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/40 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">{s.icon}{s.label}</div>
              <p className="text-white text-sm font-semibold truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3-column grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Subscription status */}
        <Section icon={<TimerReset size={16} />} title="Subscription" accent={health.color}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border mb-4 ${health.bg} ${health.border}`}>
            <span className={health.color}>{health.icon}</span>
            <span className={`text-sm font-semibold ${health.color}`}>{health.label}</span>
            {user.days_remaining !== null && user.days_remaining >= 0 && (
              <span className="ml-auto text-xs font-bold text-white">{user.days_remaining}d left</span>
            )}
          </div>

          <Row label="Purchase Date">{fmt(user.purchase_date)}</Row>
          <Row label="Expiry Date">
            <span className={user.days_remaining !== null && user.days_remaining <= 7 ? 'text-red-400 font-semibold' : ''}>
              {fmt(user.computed_end_date)}
            </span>
          </Row>
          <Row label="Plan Type">
            <span className="capitalize">{user.plan_type || '—'}</span>
          </Row>


          {/* Time consumed bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Time consumed</span>
              <span className="text-white font-medium">{timeUsedPct}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div className={`${health.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${timeUsedPct}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1 text-slate-500">
              <span>{fmt(user.purchase_date)}</span>
              <span>{fmt(user.computed_end_date)}</span>
            </div>
          </div>
        </Section>

        {/* Package details */}
        <Section icon={<Package size={16} />} title="Package Details" accent="text-indigo-400">
          <Row label="Package">{user.package_display_name || '—'}</Row>
          <Row label="Monthly Price">
            {user.price_monthly != null ? `$${Number(user.price_monthly).toFixed(2)} / mo` : '—'}
          </Row>
          <Row label="Yearly Price">
            {user.price_yearly != null ? `$${Number(user.price_yearly).toFixed(2)} / yr` : '—'}
          </Row>
          <Row label="Active Plan"><span className="capitalize">{user.plan_type || '—'}</span></Row>
          <Row label="Max Users">{maxUsers != null ? maxUsers : 'Unlimited'}</Row>

          {pkg?.description && (
            <p className="text-slate-400 text-xs mt-3 pt-3 border-t border-slate-700/40 leading-relaxed">
              {pkg.description}
            </p>
          )}

          {pkg?.features && pkg.features.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-1.5">
              {pkg.features.map((f: string) => (
                <div key={f} className="flex items-center gap-2 text-slate-300 text-xs">
                  <CheckCircle size={11} className="text-indigo-400 flex-shrink-0" />{f}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* System capacity */}
        <Section icon={<Layers size={16} />} title="System Capacity" accent="text-emerald-400">
          {/* Used / Total arc-style display */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={usedPct >= 90 ? '#ef4444' : usedPct >= 70 ? '#f59e0b' : '#10b981'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - usedPct / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-2xl font-bold">{sub.total}</span>
                <span className="text-slate-400 text-xs">/ {maxUsers ?? '∞'}</span>
              </div>
            </div>
          </div>

          <Row label="Active Users">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <UserCheck size={13} />{sub.active}
            </span>
          </Row>
          <Row label="Inactive Users">
            <span className="flex items-center gap-1.5 text-slate-400">
              <UserX size={13} />{sub.inactive}
            </span>
          </Row>
          <Row label="Slots Used">
            <span className={usedPct >= 90 ? 'text-red-400 font-semibold' : ''}>
              {maxUsers ? `${sub.total} / ${maxUsers} (${usedPct}%)` : `${sub.total} used`}
            </span>
          </Row>
          <Row label="Slots Available">
            {maxUsers
              ? <span className={maxUsers - sub.total === 0 ? 'text-red-400' : 'text-emerald-400'}>{maxUsers - sub.total}</span>
              : <span className="text-emerald-400">Unlimited</span>}
          </Row>

          {maxUsers && (
            <div className="mt-4">
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ── Account info ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <Section icon={<Mail size={16} />} title="Account Information">
          <Row label="Full Name">{user.name}</Row>
          <Row label="Email">{user.email}</Row>
          <Row label="Role"><span className="capitalize">{user.role}</span></Row>
          <Row label="Tenant ID">{user.tenant_id || '—'}</Row>
          <Row label="Source">
            <span className="capitalize">{user.source || '—'}</span>
          </Row>
          <Row label="Password Change Required">
            <span className={user.password_must_change ? 'text-amber-400' : 'text-emerald-400'}>
              {user.password_must_change ? 'Yes' : 'No'}
            </span>
          </Row>
          <Row label="Registered">{fmt(user.created_at)}</Row>
        </Section>

        <Section icon={<DollarSign size={16} />} title="Billing Summary" accent="text-amber-400">
          <Row label="Package">{user.package_display_name || '—'}</Row>
          <Row label="Active Plan"><span className="capitalize">{user.plan_type || '—'}</span></Row>
          <Row label="Price This Cycle">
            {activePlanPrice != null ? `$${Number(activePlanPrice).toFixed(2)}` : '—'}
          </Row>
          <Row label="Next Renewal">{fmt(user.computed_end_date)}</Row>
          <Row label="Days Remaining">
            {user.days_remaining === null ? '—'
              : user.days_remaining < 0
                ? <span className="text-red-400 font-semibold">Expired {Math.abs(user.days_remaining)} days ago</span>
                : <span className={user.days_remaining <= 7 ? 'text-red-400 font-semibold' : user.days_remaining <= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                    {user.days_remaining} days
                  </span>
            }
          </Row>
        </Section>
      </div>

      {/* ── Sub Users table ────────────────────────────────────────────────── */}
      <Section
        icon={<Users size={16} />}
        title={`System Users  (${sub.total}${maxUsers ? ` / ${maxUsers}` : ''})`}
        accent="text-blue-400"
        action={
          <button
            onClick={() => { setShowAddForm(v => !v); setSubFormError(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showAddForm
                ? 'bg-slate-700 text-slate-300'
                : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
            }`}
          >
            {showAddForm ? <><XCircle size={12} /> Cancel</> : <><Plus size={12} /> Add User</>}
          </button>
        }
      >
        {/* Add form */}
        {showAddForm && (
          <form onSubmit={handleAddSubUser} className="mb-5 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl space-y-3">
            <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus size={14} className="text-blue-400" /> Add New System User
            </p>
            {subFormError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <XCircle size={12} />{subFormError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Name <span className="text-red-400">*</span></label>
                <input type="text" value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Email</label>
                <input type="email" value={subForm.email} onChange={e => setSubForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" className={inputCls} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Role</label>
                <select value={subForm.role} onChange={e => setSubForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                  <option value="accountant">Accountant</option>
                  <option value="hr">HR</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Department</label>
                <input type="text" value={subForm.department} onChange={e => setSubForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Finance, HR…" className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-all">Cancel</button>
              <button type="submit" disabled={subSubmitting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-all">
                {subSubmitting ? <><RefreshCw size={13} className="animate-spin" /> Adding…</> : <><Plus size={13} /> Add User</>}
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {subUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm">
            <Users size={32} className="mb-2 opacity-30" />
            No system users added yet.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/40">
                  {['User', 'Email', 'Role', 'Department', 'Status', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-medium px-5 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {subUsers.map(su => (
                  <tr key={su.id} className="hover:bg-slate-700/15 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600/40 to-slate-700/40 flex items-center justify-center text-slate-300 text-xs font-bold flex-shrink-0">
                          {su.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-medium whitespace-nowrap">{su.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{su.email || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-300 text-xs capitalize">{su.role}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{su.department || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium border ${
                        su.is_active
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-600/30 text-slate-400 border-slate-600/40'
                      }`}>
                        {su.is_active ? <UserCheck size={11} /> : <UserX size={11} />}
                        {su.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(su.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSubUser(su.id)}
                          title={su.is_active ? 'Deactivate' : 'Activate'}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                            su.is_active
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {su.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button
                          onClick={() => deleteSubUser(su.id)}
                          title="Remove user"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Status modal ───────────────────────────────────────────────────── */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-1">Manage Account Status</h3>
            <p className="text-slate-400 text-sm mb-5">Update the account status for <strong className="text-white">{user.name}</strong>.</p>
            <div className="space-y-2 mb-4">
              {(['active', 'suspended', 'inactive'] as const).map(s => {
                const cfg = statusConfig[s];
                return (
                  <label key={s} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${newStatus === s ? `${cfg.color} ${cfg.border}` : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    <input type="radio" name="status" value={s} checked={newStatus === s} onChange={() => setNewStatus(s)} className="hidden" />
                    {cfg.icon}
                    <span className="text-sm font-medium capitalize">{s}</span>
                  </label>
                );
              })}
            </div>
            <div className="mb-5">
              <label className="text-slate-300 text-sm block mb-1.5">Reason (optional)</label>
              <textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Reason for status change…" rows={2} className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-all">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={statusLoading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-all">
                {statusLoading ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserDetail;
