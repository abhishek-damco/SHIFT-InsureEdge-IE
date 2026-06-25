import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Do NOT auto-redirect on 401 — PermissionContext and group API calls
// receive 401 when the .NET session cookie is absent, and they handle
// it gracefully themselves. A full-page redirect here causes a reload loop.
api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);

export default api;
