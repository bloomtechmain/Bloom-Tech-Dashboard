import React, { useEffect, useState, useCallback } from 'react';
import { Clock, RefreshCw, CheckCheck, Eye, AlertTriangle, XCircle, Package, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdminLayout from '../layouts/AdminLayout';
import { useNotifications } from '../context/NotificationContext';

interface ExpiringUser {
  id: number;
  name: string;
  email: string;
  tenant_id: string | null;
  package_name: string;
  plan_type: string;
  package_price: number;
  purchase_date: string;
  end_date: string;
  days_remaining: number;
}

/**
 * Returns urgency colours based on days remaining relative to the plan's window.
 * Monthly window = 7 days, yearly window = 30 days.
 * We use the same four tiers but scaled to each window:
 *   tier 1 (critical) : ≤ 10 % of window  → red
 *   tier 2 (high)     : ≤ 30 % of window  → red-light
 *   tier 3 (medium)   : ≤ 60 % of window  → amber
 *   tier 4 (low)      : > 60 % of window  → yellow
 */
function urgency(days: number, planType: string): { bar: string; badge: string; row: string } {
  const window = planType === 'yearly' ? 30 : 7;
  const pct = days / window;
  if (pct <= 0.10) return { bar: 'bg-red-500',   badge: 'bg-red-500/15 text-red-400 border-red-500/30',       row: 'bg-red-500/5'   };
  if (pct <= 0.30) return { bar: 'bg-red-400',   badge: 'bg-red-500/15 text-red-400 border-red-500/30',       row: 'bg-red-500/3'   };
  if (pct <= 0.60) return { bar: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', row: 'bg-amber-500/3' };
  return                   { bar: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', row: '' };
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PackageExpireReminder: React.FC = () => {

  const { notifications, markAllRead, fetchCounts } = useNotifications();
  const navigate = useNavigate();

  const [users, setUsers]     = useState<ExpiringUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [marking, setMarking] = useState(false);

  const fetchExpiring = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/admin/notifications/expiring');
      if (res.data.success) setUsers(res.data.users);
    } catch { setError('Failed to load expiring subscriptions.'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchExpiring(); }, [fetchExpiring]);

  const unreadExpire = notifications.filter(n => n.type === 'expire_warning' && !n.is_read).length;

  const handleMarkAllRead = async () => {
    setMarking(true);
    await markAllRead('expire_warning');
    fetchCounts();
    setMarking(false);
  };

  return (
    <AdminLayout
      title="Package Expire Reminders"
      subtitle="Monthly plans: last 7 days · Yearly plans: last 30 days"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {unreadExpire > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium">
              <AlertTriangle size={14} />
              {unreadExpire} unread notification{unreadExpire > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExpiring}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          {unreadExpire > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={marking}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-600/30 transition-all disabled:opacity-60"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'Expiring Today',
              count: users.filter(u => u.days_remaining === 0).length,
              color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
            },
            {
              label: 'Within 3 Days',
              count: users.filter(u => u.days_remaining > 0 && u.days_remaining <= 3).length,
              color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20',
            },
            {
              label: 'Within 7 Days (monthly)',
              count: users.filter(u => u.plan_type !== 'yearly' && u.days_remaining > 3).length,
              color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              label: 'Within 30 Days (yearly)',
              count: users.filter(u => u.plan_type === 'yearly' && u.days_remaining > 3).length,
              color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20',
            },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
              <p className="text-slate-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 gap-2 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Checking subscriptions…
          </div>
        ) : error ? (
          <div className="p-6 text-red-400 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
            <CheckCheck size={32} className="mb-2 opacity-30 text-emerald-400" />
            <p className="text-emerald-400 font-medium">No expiring subscriptions</p>
            <p className="text-slate-500 text-xs mt-1">Monthly plans have &gt;7 days · Yearly plans have &gt;30 days remaining.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['User', 'Package', 'Purchase Date', 'Expiry Date', 'Time Left', 'Progress', 'Actions'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {users.map(u => {
                  const window = u.plan_type === 'yearly' ? 30 : 7;
                  const urg = urgency(u.days_remaining, u.plan_type);
                  const pct = Math.max(0, Math.round((u.days_remaining / window) * 100));
                  return (
                    <tr key={u.id} className={`transition-colors hover:bg-slate-700/20 ${urg.row}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{u.name}</p>
                            <p className="text-slate-400 text-xs flex items-center gap-1">
                              <Mail size={10} />{u.email}
                            </p>
                            {u.tenant_id && (
                              <p className="text-slate-500 text-xs">{u.tenant_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs w-fit">
                          <Package size={10} />{u.package_name}
                        </span>
                        <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          u.plan_type === 'yearly'
                            ? 'bg-indigo-500/15 text-indigo-400'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {u.plan_type === 'yearly' ? 'Yearly · 30d window' : 'Monthly · 7d window'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{fmt(u.purchase_date)}</td>
                      <td className="px-4 py-3 text-white text-sm font-medium">{fmt(u.end_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${urg.badge}`}>
                          {u.days_remaining === 0
                            ? <><XCircle size={11} /> Expires Today</>
                            : <><Clock size={11} /> {u.days_remaining}d left</>}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-28">
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                          <div className={`${urg.bar} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{pct}% remaining</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs hover:bg-blue-500/15 hover:text-blue-400 transition-all"
                        >
                          <Eye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PackageExpireReminder;
