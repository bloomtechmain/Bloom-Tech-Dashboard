import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

// Attach stored token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bloomaudit_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid token), clear auth and redirect to login
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
