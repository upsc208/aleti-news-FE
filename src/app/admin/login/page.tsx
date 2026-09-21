'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { loginAdmin } from '@/lib/adminSession';

/* 관리자 로그인 화면*/
export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginAdmin(username, password);
      router.push('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0b10] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-aleti-navy/15 dark:border-volt/15 border-t-4 border-t-aleti-red dark:border-t-volt p-6"
      >
        <h1 className="mb-6 text-xl font-black tracking-tight text-aleti-navy dark:text-volt">관리자 로그인</h1>

        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400" htmlFor="admin-username">
          아이디
        </label>
        <input
          id="admin-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="mt-1 mb-4 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-gray-900 dark:text-white"
        />

        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400" htmlFor="admin-password">
          비밀번호
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="mt-1 mb-4 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-gray-900 dark:text-white"
        />

        {error && <p className="mb-3 text-sm font-semibold text-aleti-red dark:text-volt">{error}</p>}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full rounded-xl bg-aleti-navy dark:bg-volt px-4 py-2.5 font-bold text-white dark:text-[#0a0b10] disabled:opacity-40"
        >
          {busy ? '확인 중…' : '로그인'}
        </button>
      </form>
    </main>
  );
}
