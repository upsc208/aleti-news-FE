'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminHeaders, API_BASE_URL, checkAdminSession, getAdminToken } from '@/lib/adminSession';
import { revalidateNews } from '@/lib/revalidateNews';

/* 기사 페이지의 관리자 도구 */
export default function AdminArticleActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminSession().then(setIsAdmin);
  }, []);

  if (!isAdmin) return null;

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      // 404는 이미 지워진 기사라 캐시 비우기만 다시 시도
      if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || '삭제하지 못했습니다.');
      }
      const cleared = await revalidateNews(id, getAdminToken()).catch(() => false);
      if (!cleared) throw new Error('기사는 지웠지만 페이지 캐시를 비우지 못했습니다. 다시 눌러 주세요.');
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다.');
      setBusy(false);
    }
  }

  return (
    <div className="mb-10 rounded-2xl border border-aleti-red/30 dark:border-volt/30 p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-aleti-red dark:text-volt">관리자</p>

      {confirming ? (
        <div>
          <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
            &lsquo;{title}&rsquo; 기사를 지웁니다. 되돌릴 수 없습니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-xl bg-aleti-red px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? '지우는 중…' : '삭제'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-xl border border-aleti-red/40 dark:border-volt/40 px-4 py-2 text-sm font-bold text-aleti-red dark:text-volt"
        >
          이 기사 삭제
        </button>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-aleti-red dark:text-volt">{error}</p>}
    </div>
  );
}
