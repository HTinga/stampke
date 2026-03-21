// ─── Tomo API Client ──────────────────────────────────────────────────────────
// Reads VITE_API_URL from .env — falls back to demo mode when not set

const BASE = import.meta.env.VITE_API_URL || '';
const IS_DEMO = !BASE;

// ── Token storage ─────────────────────────────────────────────────────────────
export const tokenStore = {
  get: () => localStorage.getItem('tomo_token'),
  set: (t: string) => localStorage.setItem('tomo_token', t),
  clear: () => localStorage.removeItem('tomo_token'),
};

// ── Base fetch ────────────────────────────────────────────────────────────────
async function req<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<{ success: boolean; data: T; message?: string }> {
  if (IS_DEMO) {
    // In demo mode, return a mock success so the UI doesn't crash
    return { success: false, data: null as any, message: 'demo' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({ success: false, message: 'Invalid response' }));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return { success: true, data: json, message: json.message };
}

const get  = <T>(path: string)           => req<T>('GET', path);
const post = <T>(path: string, body: any) => req<T>('POST', path, body);
const patch= <T>(path: string, body: any) => req<T>('PATCH', path, body);
const del  = <T>(path: string)           => req<T>('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:   (data: any) => post('/auth/register', data),
  login:      (email: string, password: string) => post('/auth/login', { email, password }),
  googleSignIn: (idToken: string) => post('/auth/google', { idToken }),
  me:         () => get('/auth/me'),
  updateMe:   (data: any) => patch('/auth/me', data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  users:        (params?: any) => get(`/admin/users${params ? '?' + new URLSearchParams(params) : ''}`),
  activate:     (id: string)   => patch(`/admin/users/${id}/activate`, {}),
  suspend:      (id: string, reason?: string) => patch(`/admin/users/${id}/suspend`, { reason }),
  deleteUser:   (id: string)   => del(`/admin/users/${id}`),
  workers:      (params?: any) => get(`/admin/workers${params ? '?' + new URLSearchParams(params) : ''}`),
  approveWorker:(id: string)   => patch(`/admin/workers/${id}/approve`, {}),
  suspendWorker:(id: string, note?: string) => patch(`/admin/workers/${id}/suspend`, { note }),
  rateWorker:   (id: string, rating: number, note?: string) => patch(`/admin/workers/${id}/rate`, { rating, note }),
  deleteWorker: (id: string)   => del(`/admin/workers/${id}`),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientAPI = {
  summary: () => get('/clients/summary'),
  list:    (params?: any) => get(`/clients?${new URLSearchParams(params || {})}`),
  create:  (data: any) => post('/clients', data),
  read:    (id: string) => get(`/clients/${id}`),
  update:  (id: string, data: any) => patch(`/clients/${id}`, data),
  remove:  (id: string) => del(`/clients/${id}`),
};

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  summary:    () => get('/invoices/summary'),
  list:       (params?: any) => get(`/invoices?${new URLSearchParams(params || {})}`),
  create:     (data: any) => post('/invoices', data),
  read:       (id: string) => get(`/invoices/${id}`),
  update:     (id: string, data: any) => patch(`/invoices/${id}`, data),
  markPaid:   (id: string) => patch(`/invoices/${id}/paid`, {}),
  remind:     (id: string) => post(`/invoices/${id}/remind`, {}),
  remove:     (id: string) => del(`/invoices/${id}`),
};

// ── Workers ───────────────────────────────────────────────────────────────────
export const workerAPI = {
  list:       (params?: any) => get(`/workers?${new URLSearchParams(params || {})}`),
  myProfile:  () => get('/workers/me'),
  upsert:     (data: any) => post('/workers/me', data),
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobAPI = {
  list:         (params?: any) => get(`/jobs?${new URLSearchParams(params || {})}`),
  mine:         () => get('/jobs/mine'),
  create:       (data: any) => post('/jobs', data),
  read:         (id: string) => get(`/jobs/${id}`),
  update:       (id: string, data: any) => patch(`/jobs/${id}`, data),
  remove:       (id: string) => del(`/jobs/${id}`),
  apply:        (id: string, data: any) => post(`/jobs/${id}/apply`, data),
  updateApplicant: (id: string, applicantId: string, status: string) =>
    patch(`/jobs/${id}/applicant`, { applicantId, status }),
};
