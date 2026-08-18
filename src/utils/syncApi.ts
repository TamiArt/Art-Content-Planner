import type { AppData } from '../types';

export interface AccountUser { id: number; email: string }
export interface SyncSnapshot { data: AppData | null; revision: number; updatedAt: string | null }

export interface ApiError extends Error {
  status?: number;
  code?: 'api-unavailable' | 'invalid-response' | 'network-error';
}

const apiError = (message: string, status?: number, code?: ApiError['code']): ApiError =>
  Object.assign(new Error(message), { status, code });

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw apiError('Сервер синхронизации недоступен. Можно продолжить работу локально.', 0, 'network-error');
  }

  if (response.status === 204) return null as T;

  const raw = await response.text();
  let result: unknown = null;

  if (raw) {
    try {
      result = JSON.parse(raw) as unknown;
    } catch {
      if (!response.ok) {
        const message = response.status === 404
          ? 'Сервер синхронизации не подключен к этому размещению. Можно продолжить работу локально.'
          : `Сервер вернул ошибку HTTP ${response.status}`;
        throw apiError(message, response.status, response.status === 404 ? 'api-unavailable' : 'invalid-response');
      }
      throw apiError('Сервер вернул некорректный ответ вместо JSON.', response.status, 'invalid-response');
    }
  }

  if (!response.ok) {
    const serverMessage = typeof result === 'object' && result !== null && 'error' in result
      ? String((result as { error?: unknown }).error ?? '')
      : '';
    throw apiError(
      serverMessage || `Ошибка соединения с сервером (HTTP ${response.status})`,
      response.status,
      response.status === 404 ? 'api-unavailable' : undefined,
    );
  }

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
