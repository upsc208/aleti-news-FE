'use server';

/* 관리자가 지운 기사를 페이지 캐시에서 내리는 서버 액션 */
import { revalidatePath } from 'next/cache';

// adminSession.ts는 클라이언트 모듈이라 주소를 따로 계산
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.atleti.kr').replace(/\/$/, '');

export async function revalidateNews(id: number, token: string | null): Promise<boolean> {
  if (!token) return false;

  // 관리자 토큰이 살아 있을 때만 캐시를 비움
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/session`, { headers: { 'X-Admin-Token': token } });
  if (!response.ok) return false;

  revalidatePath(`/news/${id}`);
  return true;
}
