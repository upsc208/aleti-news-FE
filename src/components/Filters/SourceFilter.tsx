'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { NewsSource } from '@/client/types.gen';

interface SourceFilterProps {
  allSources: NewsSource[];
}

export default function SourceFilter({ allSources }: SourceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedIdsFromUrl = useMemo(() => {
    const sourcesParam = searchParams.get('sources');
    if (!sourcesParam) return allSources.map(s => s.id?.toString() || ''); // Default to all if no param
    if (sourcesParam === 'none') return [];
    return sourcesParam.split(',');
  }, [searchParams, allSources]);

  const toggleSource = (id: number) => {
    const idStr = id.toString();
    let nextIds: string[];

    if (selectedIdsFromUrl.includes(idStr)) {
      // Unchecking
      nextIds = selectedIdsFromUrl.filter((sId) => sId !== idStr);
    } else {
      // Checking
      nextIds = [...selectedIdsFromUrl, idStr];
    }

    const params = new URLSearchParams(searchParams.toString());

    // Logic for URL param
    if (nextIds.length === allSources.length && nextIds.length > 0) {
      // All selected -> clear param for clean URL
      params.delete('sources');
    } else if (nextIds.length === 0) {
      // None selected
      params.set('sources', 'none');
    } else {
      params.set('sources', nextIds.join(','));
    }

    params.set('page', '1');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative md:sticky md:top-28 w-full mx-auto">
      <div className="relative bg-white rounded-3xl border border-gray-200 shadow-xl pt-8 px-6 pb-10">
        <div className="flex flex-col items-center mb-6">
          <div className="h-1 w-10 bg-gray-200 rounded-full mb-4"></div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest text-center">
            필터
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {allSources.length > 0 ? (
            allSources.map((source) => {
              const isSelected = selectedIdsFromUrl.includes(source.id?.toString() || '');
              return (
                <label
                  key={source.internalId}
                  className={`
                    flex items-center justify-between px-5 py-3.5 rounded-xl cursor-pointer transition-all border
                    ${isSelected
                      ? 'bg-aleti-red/5 border-aleti-red/30 text-aleti-red shadow-sm'
                      : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-aleti-navy/20'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-4 h-4 rounded-md flex items-center justify-center border transition-all
                      ${isSelected ? 'bg-aleti-red border-aleti-red' : 'bg-white border-gray-200'}
                    `}>
                      {isSelected && <Check size={10} className="text-white stroke-[4px]" />}
                    </div>
                    <span className={`text-[13px] font-bold tracking-tight ${isSelected ? 'text-aleti-red' : 'text-gray-600'}`}>
                      {source.displayName}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleSource(source.id!)}
                  />
                </label>
              );
            })
          ) : (
            <p className="text-[10px] font-bold text-gray-300 italic text-center">No sources available.</p>
          )}
        </div>

        <div className="flex gap-2 mt-8">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('sources');
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            disabled={selectedIdsFromUrl.length === allSources.length}
            className={`
              flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
              ${selectedIdsFromUrl.length === allSources.length
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                : 'bg-aleti-navy text-white hover:bg-aleti-red shadow-md'}
            `}
          >
            Select All
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('sources', 'none');
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            disabled={selectedIdsFromUrl.length === 0}
            className={`
              flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
              ${selectedIdsFromUrl.length === 0
                ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-aleti-red hover:text-aleti-red shadow-md'}
            `}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
