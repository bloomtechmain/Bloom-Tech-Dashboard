import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

interface User {
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
  plan_type: string | null;
  purchase_date: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  package_max_users: number | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/30',
  inactive: 'bg-slate-600/30 text-slate-400 border-slate-600/40',
};

const packageColors: Record<string, string> = {
  Basic: 'bg-slate-700/50 text-slate-300',
  Pro: 'bg-blue-500/15 text-blue-400',
  Enterprise: 'bg-indigo-500/15 text-indigo-400',
};

const Users: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (packageFilter) params.package = packageFilter;

      const res = await api.get('/api/admin/users', { params });

      if (res.data.success) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter, packageFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <AdminLayout title="Users" subtitle={`${total} registered users`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </form>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-800/60 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={packageFilter}
          onChange={e => { setPackageFilter(e.target.value); setPage(1); }}
          className="bg-slate-800/60 border border-slate-700 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        >
          <option value="">All Packages</option>
          <option value="Starter">Starter</option>
          <option value="Basic">Basic</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 gap-2 text-sm">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading users...
          </div>
        ) : error ? (
          <div className="p-6 text-red-400 text-sm">{error}</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
            <Search size={32} className="mb-2 opacity-30" />
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">User</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Package</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Tenant ID</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Source</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Status</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Joined</th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium leading-tight">{user.name}</p>
                          <p className="text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.package_display_name ? (
                        <div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${packageColors[user.package_name ?? ''] || 'bg-slate-700/50 text-slate-300'}`}>
                            {user.package_display_name}
                          </span>
                          {user.plan_type && (
                            <p className="text-slate-500 text-xs mt-0.5 capitalize">{user.plan_type}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm font-mono text-xs">{user.tenant_id || '—'}</td>
                    <td className="px-4 py-3">
                      {user.source ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-400 text-xs capitalize">{user.source}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[user.account_status] || 'bg-slate-600 text-slate-300'}`}>
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs hover:bg-blue-500/15 hover:text-blue-400 transition-all"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Users;
