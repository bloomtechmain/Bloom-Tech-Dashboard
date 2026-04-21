import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import { useAdminAuth } from './AdminAuthContext';

export interface Notification {
  id: number;
  type: string;
  user_id: number | null;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_package?: string;
}

interface Counts { total: number; expire: number; other: number; }

interface NotificationContextType {
  notifications: Notification[];
  counts: Counts;
  fetchNotifications: () => Promise<void>;
  fetchCounts: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: (type?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, expire: 0, other: 0 });
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/admin/notifications/counts');
      if (res.data.success) setCounts(res.data);
    } catch {}
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/admin/notifications?limit=50');
      if (res.data.success) setNotifications(res.data.notifications);
    } catch {}
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/api/admin/notifications/${id}/read`, {});
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
      fetchCounts();
    } catch {}
  }, [fetchCounts]);

  const markAllRead = useCallback(async (type?: string) => {
    try {
      await api.patch('/api/admin/notifications/read-all', type ? { type } : {});
      setNotifications(n => n.map(x => (!type || x.type === type) ? { ...x, is_read: true } : x));
      fetchCounts();
    } catch {}
  }, [fetchCounts]);

  // Initial fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    fetchCounts();
  }, [isAuthenticated, fetchNotifications, fetchCounts]);

  // Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const s = io(backendUrl, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('notification:new', (n: Notification) => {
      setNotifications(prev => [n, ...prev]);
      setCounts(c => ({
        total: c.total + 1,
        expire: n.type === 'expire_warning'  ? c.expire + 1 : c.expire,
        other:  n.type !== 'expire_warning'  ? c.other  + 1 : c.other,
      }));
    });

    return () => { s.disconnect(); setSocket(null); };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ notifications, counts, fetchNotifications, fetchCounts, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
