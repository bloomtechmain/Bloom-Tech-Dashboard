import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, LogOut,
  ChevronLeft, ChevronRight, ShieldCheck,
  Clock, Bell,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNotifications } from '../context/NotificationContext';

const Badge: React.FC<{ count: number; collapsed: boolean }> = ({ count, collapsed }) => {
  if (!count) return null;
  return (
    <span className={`flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold leading-none ${
      collapsed
        ? 'absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px]'
        : 'min-w-[18px] h-[18px] px-1 text-[10px]'
    }`} style={{ background: 'linear-gradient(135deg, #ef4444, #ec4899)', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useAdminAuth();
  const { counts } = useNotifications();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard',        icon: LayoutDashboard, label: 'Dashboard',        badge: 0             },
    { to: '/admin/users',            icon: Users,           label: 'Users',            badge: 0             },
    { to: '/admin/packages',         icon: Package,         label: 'Packages',         badge: 0             },
    { to: '/admin/expire-reminders', icon: Clock,           label: 'Expire Reminders', badge: counts.expire },
    { to: '/admin/other-reminders',  icon: Bell,            label: 'Other Reminders',  badge: counts.other  },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen transition-all duration-300 ease-in-out z-20 ${collapsed ? 'w-[72px]' : 'w-64'}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)' }} />

      {/* Logo area */}
      <div
        className={`flex items-center gap-3 px-4 py-[18px] ${collapsed ? 'justify-center' : ''}`}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.5), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <ShieldCheck size={17} className="text-white" />
          </div>
          {/* glow halo */}
          <div className="absolute inset-0 rounded-xl opacity-60 blur-md -z-10"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
        </div>

        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight tracking-tight"
              style={{ background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BloomAudit
            </p>
            <p className="text-[11px] text-slate-500 tracking-wide">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active background */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))',
                      border: '1px solid rgba(99,102,241,0.3)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                {/* Hover background */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}

                {/* Active left accent bar */}
                {isActive && !collapsed && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg, #818cf8, #a78bfa)', boxShadow: '0 0 8px rgba(129,140,248,0.8)' }}
                  />
                )}

                {/* Icon */}
                <span className={`relative flex-shrink-0 transition-colors ${isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  <Icon size={18} />
                  {collapsed && <Badge count={badge} collapsed />}
                </span>

                {!collapsed && (
                  <>
                    <span className="relative whitespace-nowrap flex-1 transition-colors">{label}</span>
                    <Badge count={badge} collapsed={false} />
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: admin info + logout */}
      <div className="px-2 py-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && admin && (
          <div
            className="px-3 py-2.5 rounded-xl mb-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}
                >
                  {admin.name?.charAt(0).toUpperCase() ?? 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
                  style={{ borderColor: '#070c1b', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-xs font-semibold truncate leading-tight">{admin.name}</p>
                <p className="text-slate-500 text-[10px] truncate leading-tight">{admin.email}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => { logout(); navigate('/admin/login'); }}
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          style={{ position: 'relative' }}
        >
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(239,68,68,0.08)' }} />
          <LogOut size={17} className="relative flex-shrink-0" />
          {!collapsed && <span className="relative">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-4 top-[20px] w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20"
        style={{
          background: 'rgba(7,12,27,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
