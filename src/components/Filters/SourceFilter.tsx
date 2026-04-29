'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { NewsSource } from '@/client/types.gen';

interface SourceFilterProps {
  allSources: NewsSource[];
}

export default function SourceFilter({ allSources }: SourceFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedInternalIdsFromUrl = useMemo(() => {
    const sourcesParam = searchParams.get('sources');
    if (!sourcesParam) return allSources.map(s => s.internalId); // Default to all if no param
    if (sourcesParam === 'none') return [];
    return sourcesParam.split(',');
  }, [searchParams, allSources]);

  const toggleSource = (internalId: string) => {
    let nextInternalIds: string[];
    
    if (selectedInternalIdsFromUrl.includes(internalId)) {
      // Unchecking
      nextInternalIds = selectedInternalIdsFromUrl.filter((id) => id !== internalId);
    } else {
      // Checking
      nextInternalIds = [...selectedInternalIdsFromUrl, internalId];
    }

    const params = new URLSearchParams(searchParams.toString());
    
    // Logic for URL param
    if (nextInternalIds.length === allSources.length && nextInternalIds.length > 0) {
      // All selected -> clear param for clean URL
      params.delete('sources');
    } else if (nextInternalIds.length === 0) {
      // None selected
      params.set('sources', 'none');
    } else {
      params.set('sources', nextInternalIds.join(','));
    }
    
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative sticky top-28 group w-full max-w-[320px] mx-auto">
      {/* The "Shield" Outer Border (Blue) */}
      <div 
        className="absolute -inset-[2px] bg-aleti-navy pointer-events-none shadow-2xl"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)'
        }}
      ></div>
      
      {/* The "Shield" Inner Body (White) */}
      <div 
        className="relative bg-white pt-10 px-8 pb-24"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%)'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-1.5 w-12 bg-aleti-red rounded-full mb-4"></div>
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.25em] text-center">
            Source Filter
          </h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {allSources.length > 0 ? (
            allSources.map((source) => {
              const isSelected = selectedInternalIdsFromUrl.includes(source.internalId);
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
                    onChange={() => toggleSource(source.internalId)}
                  />
                </label>
              );
            })
          ) : (
            <p className="text-[10px] font-bold text-gray-300 italic text-center">No sources available.</p>
          )}
        </div>

        {selectedInternalIdsFromUrl.length !== allSources.length && (
          <button 
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('sources');
              router.push(`?${params.toString()}`);
            }}
            className="mt-8 w-full py-3 rounded-lg bg-aleti-navy text-white text-[10px] font-black uppercase tracking-widest hover:bg-aleti-red transition-all shadow-md"
          >
            Select All
          </button>
        )}
      </div>

      {/* Subtle Bottom Glow to emphasize the point */}
      <div 
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-24 bg-aleti-navy/10 blur-3xl -z-20 pointer-events-none"
      ></div>
    </div>
  );
}
