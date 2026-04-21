import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bloomaudit_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (
      err.response?.status === 401 &&
      !window.location.pathname.includes('/admin/login')
    ) {
      localStorage.removeItem('bloomaudit_admin_token');
      localStorage.removeItem('bloomaudit_admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export default api;
