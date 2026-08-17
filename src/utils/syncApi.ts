import type { AppData } from '../types';

export interface AccountUser { id: number; email: string }
export interface SyncSnapshot { data: AppData | null; revision: number; updatedAt: string | null }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw Object.assign(new Error(result?.error || 'Ошибка соединения с сервером'), { status: response.status });
  return result as T;
}

export const authApi = {
  me: () => request<{ user: AccountUser }>('/api/auth/me'),
  login: (email: string, password: string) => request<{ user: AccountUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) => request<{ user: AccountUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<null>('/api/auth/logout', { method: 'POST' }),
};

export const syncApi = {
  load: () => request<SyncSnapshot>('/api/sync'),
  save: (data: AppData, revision: number) => request<{ revision: number; updatedAt: string }>('/api/sync', {
    method: 'PUT', body: JSON.stringify({ data, revision }),
  }),
};
