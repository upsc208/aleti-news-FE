'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkAdminSession, clearAdminToken } from '@/lib/adminSession';

/* 로그인한 관리자가 보는 첫 화면(설명용) */
export default function AdminHomePage() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    checkAdminSession().then((valid) => (valid ? setState('ok') : router.replace('/admin/login')));
  }, [router]);

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
