import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Packages from './pages/Packages';
import PackageExpireReminder from './pages/PackageExpireReminder';
import OtherReminders from './pages/OtherReminders';

const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/users/:id" element={<UserDetail />} />
            <Route path="/admin/packages" element={<Packages />} />
            <Route path="/admin/expire-reminders" element={<PackageExpireReminder />} />
            <Route path="/admin/other-reminders" element={<OtherReminders />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AdminAuthProvider>
  );
};

export default App;
