'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getUpcomingMatches } from '@/client/sdk.gen';
import type { UpcomingMatch } from '@/client/types.gen';
import { CalendarClock, FlaskConical, Home, MessageSquare, Plane, Radio, Trophy, Users } from 'lucide-react';

// 백엔드 ChatService.FREE_ROOM_ID와 같은 값
const FREE_ROOM_ID = 'free';

// 방 오픈 규칙 (ChatService.isOpen / redis-design 6.6)
const OPEN_BEFORE_MS = 60 * 60 * 1000;        // 킥오프 1시간 전
const CLOSE_AFTER_MS = 3 * 60 * 60 * 1000;    // 킥오프 3시간 후

const KST = 'ko-KR';

function formatKickoff(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(KST, {
    month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function formatOpenTime(iso: string) {
  const d = new Date(new Date(iso).getTime() - OPEN_BEFORE_MS);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(KST, {
    month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit',
  });
}

/** 남은 시간을 "3일 4시간" / "2시간 15분" / "8분" 형태로 */
function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const min = Math.floor(ms / 60000);
  const day = Math.floor(min / 1440);
  const hour = Math.floor((min % 1440) / 60);
  const minute = min % 60;
  if (day > 0) return `${day}일 ${hour}시간`;
  if (hour > 0) return `${hour}시간 ${minute}분`;
  return `${minute}분`;
}

/** 시각이 아니라 날짜 기준으로 세는 D-day (오늘 경기면 D-DAY) */
function formatDday(kickoff: number, now: number) {
  const dayOf = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const diff = Math.round((dayOf(kickoff) - dayOf(now)) / 86_400_000);
  if (diff <= 0) return 'D-DAY';
  return `D-${diff}`;
}

export default function RoomSelector() {
  const [matches, setMatches] = useState<UpcomingMatch[] | null>(null);
  const [now, setNow] = useState(0);   // 0 = 아직 시각 미확정(SSR/마운트 직전)

  useEffect(() => {
    getUpcomingMatches()
      .then((res) => {
        // 응답 순서를 믿지 않고 킥오프가 빠른 순으로 직접 정렬한다
        const list = [...(res.data ?? [])].sort(
          (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
        );
        setMatches(list.filter((m) => !isNaN(new Date(m.matchDate).getTime())));
      })
      .catch(() => setMatches([]));
  }, []);

  // 잠금 해제 시각이 지나면 새로고침 없이 열리도록 1분마다 갱신한다.
  // 첫 세팅을 setTimeout(0)으로 미루는 이유: effect 본문에서 곧바로 setState하면
  // 연쇄 렌더를 유발하고, 렌더 중 Date.now()를 읽는 것도 순수하지 않아 둘 다 피한다.
  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const timer = setInterval(update, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  // 보여줄 경기 하나를 고른다.
  //  - live: 지금 입장 가능한 방이 있는 경기
  //  - soon: 아직 안 끝난 가장 가까운 경기 (matchId가 없어도 예고는 띄운다)
  const featured = useMemo(() => {
    if (!matches || now === 0) return null;
    const kickoffOf = (m: UpcomingMatch) => new Date(m.matchDate).getTime();

    const live = matches.find(
      (m) => m.matchId && now >= kickoffOf(m) - OPEN_BEFORE_MS && now <= kickoffOf(m) + CLOSE_AFTER_MS
    );
    if (live) return { kind: 'live' as const, match: live, kickoff: kickoffOf(live) };

    const soon = matches.find((m) => now <= kickoffOf(m) + CLOSE_AFTER_MS);
    if (soon) return { kind: 'soon' as const, match: soon, kickoff: kickoffOf(soon) };

    return { kind: 'none' as const };
  }, [matches, now]);

  // "홈 vs 맨시티" / "원정 vs 맨시티"
  const versus = (m: UpcomingMatch) => `${m.isHome ? '홈' : '원정'} vs ${m.opponent}`;

  return (
    <div className="w-full bg-white dark:bg-[#0d0e14]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          채팅방 선택
        </h1>
        <p className="mt-2 mb-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          들어갈 방을 골라주세요. 자유 채팅방은 언제나 열려 있어요.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 자유 채팅방 — 상시 개방 */}
          <Link
            href={`/chat/${FREE_ROOM_ID}`}
            className="group flex flex-col rounded-2xl border-2 border-aleti-red/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-aleti-red hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-aleti-red px-2 py-0.5 text-[10px] font-black text-white">
                <Radio size={9} className="animate-pulse" />
                24시간 오픈
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-aleti-red/30 bg-aleti-red/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-aleti-red">
                <FlaskConical size={9} />
                Beta
              </span>
            </div>
            <div className="mb-1 flex items-center gap-2">
              <MessageSquare size={20} className="text-aleti-red" />
              <h2 className="text-lg font-black tracking-tight text-gray-900">자유 채팅방</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              경기가 없는 날에도 언제든 이야기 나눌 수 있는 방이에요.
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-xl bg-aleti-red px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md transition group-hover:brightness-110">
              입장하기
            </span>
          </Link>

          {/* 다음 경기 — 킥오프 1시간 전에 열리고, 그전까지는 예고로 보여준다 */}
          {!featured ? (
            <div className="flex min-h-[210px] items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50 text-xs font-bold text-gray-400">
              다음 경기 불러오는 중...
            </div>
          ) : featured.kind === 'none' ? (
            <div className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
              <CalendarClock size={20} className="text-gray-400" />
              <p className="text-sm font-black text-gray-700">다음 경기를 기다리는 중</p>
              <p className="text-xs leading-relaxed text-gray-500">
                일정이 뜨면 여기에서 먼저 알려드릴게요.
                <br />그동안은 자유 채팅방에서 놀고 계세요!
              </p>
            </div>
          ) : featured.kind === 'live' ? (
            <Link
              href={`/chat/${featured.match.matchId}`}
              className="group flex flex-col rounded-2xl border-2 border-aleti-navy/25 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-aleti-navy hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                  <Users size={9} />
                  지금 열려 있어요
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-black text-gray-500">
                  <Trophy size={9} />
                  {featured.match.tournament}
                </span>
              </div>
              <div className="mb-1 flex items-center gap-2">
                {featured.match.isHome ? (
                  <Home size={20} className="text-aleti-navy" />
                ) : (
                  <Plane size={20} className="text-aleti-navy" />
                )}
                <h2 className="text-lg font-black tracking-tight text-gray-900">
                  {versus(featured.match)}
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {formatKickoff(featured.match.matchDate)} 킥오프 · 같이 보면서 떠들어요
              </p>
              <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-xl bg-aleti-navy px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-md transition group-hover:brightness-125">
                입장하기
              </span>
            </Link>
          ) : (
            <div
              aria-disabled="true"
              className="flex flex-col rounded-2xl border-2 border-aleti-navy/15 bg-gradient-to-br from-white to-gray-50 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-aleti-navy px-2 py-0.5 text-[10px] font-black text-white">
                  <CalendarClock size={9} />
                  다음 경기 {formatDday(featured.kickoff, now)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-black text-gray-500">
                  <Trophy size={9} />
                  {featured.match.tournament}
                </span>
              </div>
              <div className="mb-1 flex items-center gap-2">
                {featured.match.isHome ? (
                  <Home size={20} className="text-aleti-navy" />
                ) : (
                  <Plane size={20} className="text-aleti-navy" />
                )}
                <h2 className="text-lg font-black tracking-tight text-gray-900">
                  {versus(featured.match)}
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-gray-600">
                {formatKickoff(featured.match.matchDate)} 킥오프
              </p>

              <div className="mt-4 rounded-xl border border-aleti-navy/10 bg-aleti-navy/5 px-3 py-2">
                {/* 오픈 시각은 지났는데 여기 있다면 아직 방 키(matchId)가 안 만들어진 경기다 */}
                {featured.kickoff - OPEN_BEFORE_MS <= now ? (
                  <>
                    <p className="text-xs font-bold text-gray-800">⚙️ 응원방 준비 중이에요</p>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                      곧 열리니 잠시 뒤에 다시 들러주세요
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-gray-800">
                      🔓 {formatOpenTime(featured.match.matchDate)}에 응원방이 열려요
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                      킥오프 1시간 전 · {formatRemaining(featured.kickoff - OPEN_BEFORE_MS - now)} 남음
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
