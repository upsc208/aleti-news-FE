'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE_URL, adminHeaders, checkAdminSession, clearAdminToken } from '@/lib/adminSession';

/* 로그인한 관리자가 보는 첫 화면(설명 + 수동 실행 버튼) */
export default function AdminHomePage() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok'>('checking');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAdminSession().then((valid) => (valid ? setState('ok') : router.replace('/admin/login')));
  }, [router]);

  const run = async (job: string, path: string) => {
    setBusy(job);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: adminHeaders() });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        clearAdminToken();
        router.replace('/admin/login');
        return;
      }
      setMessage(data?.message ?? (response.ok ? '요청을 보냈습니다.' : '실행하지 못했습니다.'));
    } catch {
      setMessage('서버에 연결하지 못했습니다.');
    } finally {
      setBusy(null);
    }
  };

  if (state === 'checking') {
    return <main className="min-h-screen bg-white dark:bg-[#0a0b10] p-8 text-gray-500">확인 중…</main>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0b10] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-black tracking-tight text-aleti-navy dark:text-volt">관리자</h1>

        <ul className="mb-8 space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            아이디∙비밀번호 <span className="font-bold">타인 공유 금지</span> 및 유저 밴/게시물 삭제는 규정 위반 시에만 신중하게 처리 부탁드립니다.
          </li>
          <li>
            기사 페이지에서 <span className="font-bold">삭제</span> 버튼이 보이며, 채팅방 글은 관리자 색으로 표시되고 <span className="font-bold">/문구</span> 입력 시 전광판에 노출됩니다.
          </li>
        </ul>

        <div className="mb-8 rounded-2xl border border-gray-200 dark:border-white/10 p-4">
          <h2 className="mb-1 font-black text-aleti-navy dark:text-volt">수동 실행</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            평소에는 자동으로 돕니다. 뉴스 수집은 15분마다, 경기 일정은 하루 두 번입니다.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => run('news', '/api/admin/news/trigger')}
              disabled={busy !== null}
              className="rounded-xl bg-aleti-red px-4 py-2 font-bold text-white disabled:opacity-50"
            >
              {busy === 'news' ? '실행 중…' : '뉴스 수집'}
            </button>
            <button
              onClick={() => run('matches', '/api/admin/matches/sync')}
              disabled={busy !== null}
              className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 font-bold text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              {busy === 'matches' ? '동기화 중…' : '경기 일정 동기화'}
            </button>
          </div>

          {message && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>}
        </div>

        <div className="flex gap-3">
          <Link href="/" className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 font-bold text-gray-700 dark:text-gray-300">
            사이트로
          </Link>
          <button
            onClick={() => {
              clearAdminToken();
              router.replace('/admin/login');
            }}
            className="rounded-xl bg-aleti-navy dark:bg-volt px-4 py-2 font-bold text-white dark:text-[#0a0b10]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </main>
  );
}
