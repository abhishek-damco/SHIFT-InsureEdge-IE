import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ADR-002: send HttpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
