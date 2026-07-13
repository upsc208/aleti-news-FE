'use client';

import { useEffect, useState } from 'react';
import { Ticket, X, Eye, ArrowUpRight } from 'lucide-react';

const SEAT_VIEW_URL = 'https://preview.3ddigitalvenue.com/atletico-de-madrid';
const OFFICIAL_TICKET_URL = 'https://en.atleticodemadrid.com/listado-de-entradas';

const OPTIONS = [
  {
    href: SEAT_VIEW_URL,
    icon: Eye,
    label: '자리 고르기',
    title: '좌석 3D 뷰',
    description: '구역과 열을 고르면 그 자리에서 보이는 시야를 360° 사진으로 보여줍니다.',
    domain: '3ddigitalvenue.com',
  },
  {
    href: OFFICIAL_TICKET_URL,
    icon: Ticket,
    label: '구매하기',
    title: '공식 예매',
    description: '경기별 실시간 가격과 잔여석을 확인하고 구매합니다.',
    domain: 'atleticodemadrid.com',
  },
];

export default function TicketModal() {
  const [isOpen, setIsOpen] = useState(false);

  // 열려 있는 동안 배경 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="group flex items-center gap-1 min-[350px]:gap-1.5 lg:gap-2 text-aleti-red dark:text-gray-300 hover:bg-aleti-red dark:hover:bg-volt/10 hover:text-white dark:hover:text-volt px-1.5 min-[350px]:px-2.5 lg:px-4 py-1.5 min-[350px]:py-2 rounded-lg sm:rounded-xl transition-all border border-aleti-red/20 dark:border-volt/10 shadow-sm shadow-aleti-red/5 dark:shadow-none shrink-0"
        title="티켓 예매 · 좌석 3D 뷰"
      >
        <Ticket className="w-4 h-4 min-[350px]:w-[18px] min-[350px]:h-[18px] lg:w-5 lg:h-5 group-hover:rotate-12 transition-transform" />
        <span className="tracking-tighter font-extrabold">티켓</span>
      </button>

      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 모바일은 바텀시트, sm 이상은 중앙 모달 */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
        className={`fixed inset-0 z-[101] flex items-end sm:items-center justify-center sm:p-4 ${
          isOpen ? '' : 'pointer-events-none'
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
          // 이 모달은 Header의 <nav> 안에 렌더된다. nav가 whitespace-nowrap /
          // font-extrabold / text-[11px]을 걸어두고 있고 이들은 상속되므로,
          // 여기서 명시적으로 끊지 않으면 설명 텍스트가 줄바꿈 없이 넘친다.
          // break-keep은 한국어를 어절 단위로 끊기 위한 것.
          className={`w-full sm:max-w-sm whitespace-normal break-keep text-base font-normal bg-white dark:bg-[#0d0e14] rounded-t-3xl sm:rounded-3xl shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${
            isOpen
              ? 'translate-y-0 opacity-100 sm:scale-100'
              : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
          }`}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
            <div>
              <h2
                id="ticket-modal-title"
                className="text-xl font-black tracking-tight text-gray-900 dark:text-white"
              >
                티켓
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                자리를 보고 나서 예매하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="닫기"
              className="-mr-2 -mt-1 shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {OPTIONS.map(({ href, icon: Icon, label, title, description, domain }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="group flex gap-4 rounded-2xl border border-gray-200 dark:border-white/[0.08] p-4 hover:border-aleti-navy dark:hover:border-volt/40 hover:bg-aleti-navy/[0.03] dark:hover:bg-volt/[0.03] transition-colors"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aleti-navy dark:bg-volt/10 text-white dark:text-volt">
                  <Icon size={20} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-aleti-navy/70 dark:text-volt/60">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-base font-black tracking-tight text-gray-900 dark:text-white">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {description}
                  </span>
                  <span className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500">
                    {domain}
                    <ArrowUpRight
                      size={13}
                      className="text-aleti-red dark:text-volt group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform motion-reduce:transform-none"
                    />
                  </span>
                </span>
              </a>
            ))}

            <p className="pt-1 text-center text-xs text-gray-400 dark:text-gray-500">
              두 링크 모두 새 탭에서 외부 사이트로 열립니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
