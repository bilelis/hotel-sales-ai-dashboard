import type {
  ChatMessage,
  ChatResponse,
  Dashboard,
  ReservationsResponse,
  ReservationDetail,
  GuestsResponse,
  GuestProfileDetail,
  AnalyticsResponse,
  SettingsResponse,
} from './types';
import { delay, mockChat, mockDashboard } from './mock';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function executeFetch(url: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 30_000): Promise<T> {
  let res: Response | null = null;
  let lastError: any = null;

  // Try direct BASE URL first (http://localhost:3001)
  const directUrl = BASE ? `${BASE}${path}` : path;
  try {
    res = await executeFetch(directUrl, init, timeoutMs);
  } catch (err) {
    lastError = err;
    // Fallback: If direct connection fails, try relative path through Vite reverse-proxy
    if (BASE && directUrl !== path) {
      try {
        res = await executeFetch(path, init, timeoutMs);
        lastError = null;
      } catch (proxyErr) {
        lastError = proxyErr;
      }
    }
  }

  if (!res) {
    if (lastError instanceof ApiError) throw lastError;
    if (lastError instanceof DOMException && lastError.name === 'AbortError') {
      throw new ApiError(0, 'The request timed out.');
    }
    throw new ApiError(0, 'Cannot reach the API. Is it running on port 3001?');
  }

  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return body as T;
}

export const getDashboard = (asOf?: string): Promise<Dashboard> => {
  if (MOCK) return delay(mockDashboard, 700);
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
  return request<Dashboard>(`/api/dashboard${q}`);
};

export const getReservations = (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<ReservationsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status && params.status !== 'All') searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return request<ReservationsResponse>(`/api/reservations${query ? `?${query}` : ''}`);
};

export const getReservationById = (id: string | number): Promise<ReservationDetail> => {
  return request<ReservationDetail>(`/api/reservations/${id}`);
};

export const updateReservationStatus = (
  id: string | number,
  status: string
): Promise<{ success: boolean; reservation: ReservationDetail }> => {
  return request<{ success: boolean; reservation: ReservationDetail }>(
    `/api/reservations/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
};

export const createReservation = (
  data: Partial<ReservationDetail>
): Promise<{ success: boolean; reservation: ReservationDetail }> => {
  return request<{ success: boolean; reservation: ReservationDetail }>('/api/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const addFolioCharge = (
  reservationId: string | number,
  data: {
    department: string;
    amount: number;
    description: string;
    date?: string;
  }
): Promise<{ success: boolean; charge: any; reservation: ReservationDetail }> => {
  return request<{ success: boolean; charge: any; reservation: ReservationDetail }>(
    `/api/reservations/${reservationId}/charges`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};

export const postRevenue = (data: {
  department: string;
  amount: number;
  description?: string;
  date?: string;
  yearMonth?: string;
  reservationId?: number | string;
}): Promise<{ success: boolean; department: string; amount: number; yearMonth: string; reservationId?: number }> => {
  return request<{ success: boolean; department: string; amount: number; yearMonth: string; reservationId?: number }>(
    '/api/revenue',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
};


export const getGuests = (params: {
  page?: number;
  limit?: number;
  search?: string;
  nationality?: string;
  vipLevel?: string;
} = {}): Promise<GuestsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.nationality && params.nationality !== 'All') searchParams.set('nationality', params.nationality);
  if (params.vipLevel && params.vipLevel !== 'All') searchParams.set('vipLevel', params.vipLevel);

  const query = searchParams.toString();
  return request<GuestsResponse>(`/api/guests${query ? `?${query}` : ''}`);
};

export const getGuestById = (id: number): Promise<GuestProfileDetail> => {
  return request<GuestProfileDetail>(`/api/guests/${id}`);
};

export const getAnalytics = (asOf?: string): Promise<AnalyticsResponse> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
  return request<AnalyticsResponse>(`/api/analytics${q}`);
};

export const getChannels = (asOf?: string): Promise<{ asOf: string; channels: any[] }> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : '';
  return request<{ asOf: string; channels: any[] }>(`/api/channels${q}`);
};

export const getSettings = (): Promise<SettingsResponse> => {
  return request<SettingsResponse>('/api/settings');
};

export const getTablesMetadata = (): Promise<{ tables: import('./types').TableMeta[] }> => {
  return request<{ tables: import('./types').TableMeta[] }>('/api/tables');
};

export const getTableData = (
  tableName: string,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<import('./types').TableDataResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return request<import('./types').TableDataResponse>(`/api/tables/${tableName}${query ? `?${query}` : ''}`);
};

/** The local LLM can take 5-30 s: allow up to 120 s. */
export const postChat = (messages: ChatMessage[]): Promise<ChatResponse> => {
  return MOCK
    ? mockChat(messages)
    : request<ChatResponse>(
        '/api/chat',
        { method: 'POST', body: JSON.stringify({ messages }) },
        120_000
      );
};

export interface AuthUser {
  username: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  permissions?: string[];
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export const loginAuth = (credentials: {
  username?: string;
  email?: string;
  password?: string;
}): Promise<LoginResponse> => {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const logoutAuth = (): Promise<{ success: boolean }> => {
  return request<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
  });
};

