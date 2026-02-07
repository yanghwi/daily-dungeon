import { useGameStore } from '../stores/gameStore';

const API_URL = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');

async function apiFetch(path: string, options?: RequestInit) {
  const token = useGameStore.getState().authToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── 인증 API ───

export async function apiRegister(displayName: string) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  }) as Promise<{ token: string; user: { id: string; displayName: string; pin: string } }>;
}

export async function apiLoginPin(pin: string) {
  return apiFetch('/api/auth/pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }) as Promise<{ token: string; user: { id: string; displayName: string; pin: string } }>;
}

export async function apiGetProfile() {
  return apiFetch('/api/me');
}

export async function apiGetRuns(limit = 20) {
  return apiFetch(`/api/runs?limit=${limit}`) as Promise<{ runs: any[] }>;
}

// ─── 데일리 ───

export async function apiGetDailyToday() {
  return apiFetch('/api/daily/today') as Promise<{ date: string; seedId: string; runCount: number }>;
}

export async function apiGetDailyLeaderboard() {
  return apiFetch('/api/daily/leaderboard') as Promise<{ date: string; runs: any[] }>;
}

// ─── Discord OAuth ───

/** Discord OAuth 리다이렉트 URL (서버가 Discord으로 리다이렉트) */
export function getDiscordLoginUrl(): string {
  return `${API_URL}/api/auth/discord`;
}
