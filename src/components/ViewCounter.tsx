'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/lib/adminSession';

/* 기사 조회수 기록, 페이지가 캐시돼도 방문마다 브라우저가 보냄 */
export default function ViewCounter({ id }: { id: number }) {
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  return null;
}
