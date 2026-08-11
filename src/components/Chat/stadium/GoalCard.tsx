'use client';

import React from 'react';
import type { GoalEvent } from './feed';

interface GoalCardProps {
  goal: GoalEvent;
}

const formatTime = (raw: string) => {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 피드 한가운데 꽂히는 골 카드.
 *
 * 실점도 같은 자리에 같은 크기로 들어간다 — 톤만 죽인다.
 * 우리 골만 크게 그리고 실점은 조용히 흘리면, 나중에 실점 소식을
 * 채팅으로 먼저 알게 되는 이상한 순서가 생긴다.
 */
export default function GoalCard({ goal }: GoalCardProps) {
  const time = formatTime(goal.at);
  const score = `${goal.homeScore}-${goal.awayScore}`;

  return (
    <div
      className={`stadium-goal-card my-3 animate-fadeIn ${
        goal.isAtleti ? 'stadium-goal-card--ours' : 'stadium-goal-card--theirs'
      }`}
      role="status"
    >
      <p className="stadium-goal-card__label">
        {goal.isAtleti ? 'GOL DEL ATLETI' : 'GOL DEL RIVAL'}
      </p>

      <p className="stadium-goal-card__headline">
        {goal.isAtleti ? `GOOOOL!!! ${goal.scorer}` : `실점 · ${goal.scorer}`}{' '}
        <span className="stadium-goal-card__score">{score}</span>{' '}
        <span aria-hidden="true">⚽</span>
      </p>

      {goal.assist && (
        <p className="stadium-goal-card__assist">어시스트 {goal.assist}</p>
      )}

      <p className="stadium-goal-card__meta">
        {[goal.minute, '메트로폴리타노', time].filter(Boolean).join(' · ')}
      </p>
    </div>
  );
}
