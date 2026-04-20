import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNotifications, Notification } from '../context/NotificationContext';

const typeIcon: Record<string, React.ReactNode> = {
  expire_warning:      <Clock size={12} className="text-amber-400" />,
  user_limit_exceeded: <AlertTriangle size={12} className="text-red-400" />,
};

const typeBg: Record<string, string> = {
  expire_warning:      'rgba(245,158,11,0.12)',
  user_limit_exceeded: 'rgba(239,68,68,0.12)',
};

const typeBorder: Record<string, string> = {
  expire_warning:      'rgba(245,158,11,0.25)',
  user_limit_exceeded: 'rgba(239,68,68,0.25)',
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface TopBarProps { title: string; subtitle?: string; }

const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { admin } = useAdminAuth();
  const { notifications, counts, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const recent = notifications.slice(0, 6);

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    navigate(n.type === 'expire_warning' ? '/admin/expire-reminders' : '/admin/other-reminders');
  };

  return (
    <header
      className="relative z-30 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Page title */}
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ background: 'linear-gradient(90deg, #fff 60%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5 tracking-wide">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3" ref={ref}>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{
              background: open ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${open ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: open ? '#a5b4fc' : '#94a3b8',
            }}
          >
            <Bell size={16} />
            {counts.total > 0 && (
              <>
                <span
                  className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full text-white text-[9px] font-bold leading-none"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#ec4899)', boxShadow: '0 0 10px rgba(239,68,68,0.55)' }}
                >
                  {counts.total > 99 ? '99+' : counts.total}
                </span>
                <span
                  className="absolute -top-1 -right-1 w-[17px] h-[17px] rounded-full animate-ping"
                  style={{ background: 'rgba(239,68,68,0.4)' }}
                />
              </>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute right-0 top-12 overflow-hidden rounded-2xl"
              style={{
                width: 348,
                background: 'rgba(8,12,28,0.97)',
                border: '1px solid rgba(255,255,255,0.09)',
                backdropFilter: 'blur(28px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
              }}
            >
              {/* Header */}
              <div
                className="relative px-4 py-3 flex items-center justify-between overflow-hidden"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 100%)' }}
                />
                <div className="relative flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}
                  >
                    <Bell size={12} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-semibold">Notifications</span>
                  {counts.total > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      {counts.total}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center gap-3">
                  {counts.total > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-72 overflow-y-auto">
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
                    >
                      <CheckCircle size={18} className="text-emerald-400 opacity-70" />
                    </div>
                    <p className="text-slate-400 text-sm">All caught up!</p>
                    <p className="text-slate-600 text-xs">No unread notifications</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {recent.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/[0.03]"
                        style={{ background: !n.is_read ? 'rgba(99,102,241,0.04)' : undefined }}
                      >
                        <span
                          className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: typeBg[n.type] ?? 'rgba(100,116,139,0.15)',
                            border: `1px solid ${typeBorder[n.type] ?? 'rgba(100,116,139,0.2)'}`,
                          }}
                        >
                          {typeIcon[n.type] ?? <Bell size={11} className="text-slate-400" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-white text-xs font-semibold truncate">{n.title}</p>
                            {!n.is_read && (
                              <span
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                                style={{ background: '#818cf8', boxShadow: '0 0 4px #818cf8' }}
                              />
                            )}
                          </div>
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{n.message}</p>
                          <p className="text-slate-600 text-[10px] mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer quick-links */}
              <div
                className="grid grid-cols-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => { setOpen(false); navigate('/admin/expire-reminders'); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                  style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Clock size={11} />
                  Expire
                  <span
                    className="px-1 rounded text-[10px] font-semibold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}
                  >
                    {counts.expire}
                  </span>
                </button>
                <button
                  onClick={() => { setOpen(false); navigate('/admin/other-reminders'); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  <ExternalLink size={11} />
                  Other
                  <span
                    className="px-1 rounded text-[10px] font-semibold"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                  >
                    {counts.other}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin chip */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="relative flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}
            >
              {admin?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#34d399', borderColor: '#070c1b', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }}
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-semibold leading-tight">{admin?.name ?? 'Admin'}</p>
            <p className="text-slate-500 text-[10px] leading-tight">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
