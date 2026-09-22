'use client';

const TOKEN_KEY = 'atleti-admin-token';

/* 관리자 로그인 토큰을 브라우저에 들고 있는 곳 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.atleti.kr').replace(/\/$/, '');

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
  }
}

// 관리자 API를 부를 때 붙이는 헤더
export function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { 'X-Admin-Token': token } : {};
}

// 토큰이 아직 살아 있는지 서버에 확인
export async function checkAdminSession(): Promise<boolean> {
  if (!getAdminToken()) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/session`, { headers: adminHeaders() });
    if (!response.ok) clearAdminToken();
    return response.ok;
  } catch {
    return false;
  }
}

// 로그인에 성공하면 받은 토큰을 저장
export async function loginAdmin(username: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || '로그인에 실패했습니다.');

  setAdminToken(data.token);
  return data.token;
}
