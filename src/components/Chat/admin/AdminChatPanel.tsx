'use client';

import { Shield, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { adminHeaders, API_BASE_URL, checkAdminSession } from '@/lib/adminSession';

interface Participant {
  nickname: string;
  ip: string;
  ipHash: string;
}

/* 관리자만 보이는 접속자 관리 팝업. */
export default function AdminChatPanel({ matchId }: { matchId: string }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [banned, setBanned] = useState<string[]>([]);
  const [busyIp, setBusyIp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminSession().then(setIsAdmin);
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const [list, bans] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/chat/${matchId}/participants`, { headers: adminHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/chat/ban`, { headers: adminHeaders() }),
      ]);
      if (!list.ok || !bans.ok) throw new Error('목록을 불러오지 못했습니다.');
      setParticipants(await list.json());
      setBanned(await bans.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
    }
  }, [matchId]);

  async function toggleBan(ip: string, isBanned: boolean) {
    setBusyIp(ip);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/chat/ban?ip=${encodeURIComponent(ip)}`, {
        method: isBanned ? 'DELETE' : 'POST',
        headers: adminHeaders(),
      });
      if (!response.ok) throw new Error(isBanned ? '차단 해제에 실패했습니다.' : '차단에 실패했습니다.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '처리하지 못했습니다.');
    } finally {
      setBusyIp('');
    }
  }

  if (!isAdmin) return null;

  // 방패 버튼 눌렀을 때 열리는 팝업
  return (
    <>
      <button
        onClick={() => { setOpen(true); load(); }}
        aria-label="접속자 관리"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-aleti-navy text-white"
      >
        <Shield size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-[#111318] sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10">
              <h2 className="text-base font-black text-aleti-navy dark:text-volt">접속자 관리</h2>
              <button onClick={() => setOpen(false)} aria-label="닫기" className="p-1 text-gray-400">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {error && <p className="mb-3 text-sm font-semibold text-aleti-red dark:text-volt">{error}</p>}

              {participants.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">지금 이 방에 닉네임을 잡은 사람이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {participants.map((person) => {
                    const isBanned = banned.includes(person.ip);
                    return (
                      <li
                        key={person.ip + person.nickname}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 px-4 py-3 dark:border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900 dark:text-white">{person.nickname}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">#{person.ipHash}</p>
                        </div>
                        <button
                          onClick={() => toggleBan(person.ip, isBanned)}
                          disabled={busyIp === person.ip}
                          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                            isBanned
                              ? 'border border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300'
                              : 'bg-aleti-red text-white'
                          }`}
                        >
                          {isBanned ? '차단 해제' : '차단'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {banned.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-gray-400">차단된 IP</p>
                  <ul className="space-y-2">
                    {banned.map((ip) => (
                      <li key={ip} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-gray-600 dark:text-gray-300">{ip}</span>
                        <button
                          onClick={() => toggleBan(ip, true)}
                          disabled={busyIp === ip}
                          className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 disabled:opacity-40 dark:border-white/10 dark:text-gray-300"
                        >
                          해제
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
