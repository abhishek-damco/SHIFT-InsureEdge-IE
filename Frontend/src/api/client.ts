import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ADR-002: send HttpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Redirect to login on 401 — except for the login call itself (and while already on /login),
// where a full reload would wipe the "Invalid username or password" message.
api.interceptors.response.use(
  res => res,
  err => {
    const isLoginCall = String(err.config?.url ?? '').includes('/auth/login');
    if (err.response?.status === 401 && !isLoginCall && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
