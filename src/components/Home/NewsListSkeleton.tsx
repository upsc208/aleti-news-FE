/* 필터·검색으로 목록을 다시 불러오는 동안 자리를 지키는 뼈대 */
export default function NewsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col min-h-[600px] -mt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">기사를 불러오는 중</span>

      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white dark:bg-[#111318] rounded-2xl border border-gray-200/80 dark:border-white/[0.06] overflow-hidden mb-4 sm:mb-5"
        >
          <div className="p-5 sm:p-6 lg:p-7 flex flex-col sm:flex-row gap-5 sm:gap-7">
            <div className="h-48 w-full sm:h-36 sm:w-52 lg:h-40 lg:w-60 shrink-0 rounded-xl bg-gray-100 dark:bg-[#16181f]" />

            <div className="flex flex-col gap-3 flex-grow min-w-0">
              <div className="h-3 w-24 rounded bg-gray-100 dark:bg-[#16181f]" />
              <div className="h-5 w-full rounded bg-gray-100 dark:bg-[#16181f]" />
              <div className="h-5 w-4/5 rounded bg-gray-100 dark:bg-[#16181f]" />
              <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-[#16181f] mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
