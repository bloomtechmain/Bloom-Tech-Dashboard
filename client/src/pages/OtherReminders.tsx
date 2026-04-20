import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell, RefreshCw, CheckCheck, Eye, AlertTriangle,
  Users, ChevronLeft, ChevronRight, Filter, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdminLayout from '../layouts/AdminLayout';
import { useNotifications, Notification } from '../context/NotificationContext';

const TRACKED_TYPES = 'user_limit_exceeded,user_added';

const typeConfig: Record<string, { label: string; icon: React.ReactNode; badge: string; iconBg: string }> = {
  user_limit_exceeded: {
    label: 'User Limit Exceeded',
    icon: <Users size={13} className="text-red-400" />,
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    iconBg: 'bg-red-500/10 border-red-500/20',
  },
  user_added: {
    label: 'User Added',
    icon: <UserPlus size={13} className="text-emerald-400" />,
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
};

const fallbackType = {
  label: 'System Notice',
  icon: <Bell size={13} className="text-slate-400" />,
  badge: 'bg-slate-600/30 text-slate-300 border-slate-600/40',
  iconBg: 'bg-slate-700/50 border-slate-600/40',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const OtherReminders: React.FC = () => {
  const { markRead, markAllRead, fetchCounts } = useNotifications();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchOther = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, any> = { page, limit: 20, type: TRACKED_TYPES };
      if (unreadOnly) params.unread = true;

      const res = await api.get('/api/admin/notifications', { params });
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch { setError('Failed to load notifications.'); }
    finally  { setLoading(false); }
  }, [page, unreadOnly]);

  useEffect(() => { fetchOther(); }, [fetchOther]);

  const unread = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    setMarking(true);
    await api.patch('/api/admin/notifications/read-all', { types: ['user_limit_exceeded', 'user_added'] });
    fetchCounts();
    fetchOther();
    setMarking(false);
  };

  const handleMarkOne = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
    }
  };

  return (
    <AdminLayout title="Other Reminders" subtitle="System alerts and activity notifications">

      {/* Top row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
              <AlertTriangle size={14} />{unread} unread
            </span>
          )}
          <span className="text-slate-400 text-sm">{total} total notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setUnreadOnly(v => !v); setPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
              unreadOnly
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Filter size={13} /> {unreadOnly ? 'Unread only' : 'All'}
          </button>
          <button
            onClick={fetchOther}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-all"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          {unread > 0 && (
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

      {/* List */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 gap-2 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading notifications…
          </div>
        ) : error ? (
          <div className="p-6 text-red-400 text-sm">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
            <Bell size={32} className="mb-2 opacity-30" />
            {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/40">
            {notifications.map(n => {
              const cfg = typeConfig[n.type] ?? fallbackType;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.is_read ? 'bg-slate-700/15' : 'hover:bg-slate-700/10'}`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${cfg.iconBg}`}>
                    {cfg.icon}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white text-sm font-semibold">{n.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{n.message}</p>

                    {/* Metadata detail */}
                    {n.type === 'user_limit_exceeded' && n.metadata && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {n.metadata.limit && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <Users size={10} /> Limit: {n.metadata.limit} users
                          </span>
                        )}
                        {n.metadata.attempted_at && (
                          <span className="text-slate-500 text-xs">
                            Attempted: {new Date(n.metadata.attempted_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    {n.type === 'user_added' && n.metadata && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {n.metadata.sub_user_name && (
                          <span className="flex items-center gap-1 text-slate-500 text-xs">
                            <UserPlus size={10} /> New user: {n.metadata.sub_user_name}
                          </span>
                        )}
                        {n.metadata.sub_user_email && (
                          <span className="text-slate-500 text-xs">{n.metadata.sub_user_email}</span>
                        )}
                        {n.metadata.added_at && (
                          <span className="text-slate-500 text-xs">
                            Added: {new Date(n.metadata.added_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-slate-600 text-xs mt-2">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    {n.user_id && (
                      <button
                        onClick={() => { handleMarkOne(n); navigate(`/admin/users/${n.user_id}`); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs hover:bg-blue-500/15 hover:text-blue-400 transition-all"
                      >
                        <Eye size={11} /> View User
                      </button>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkOne(n)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs hover:bg-slate-700 hover:text-white transition-all"
                      >
                        <CheckCheck size={11} /> Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default OtherReminders;
