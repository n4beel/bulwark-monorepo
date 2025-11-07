'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  sortBy: 'date' | 'score' | 'repository';
  sortOrder: 'asc' | 'desc';
  setSortBy: (v: 'date' | 'score' | 'repository') => void;
  setSortOrder: (v: 'asc' | 'desc') => void;
}

const OPTIONS = [
  { label: 'Sort by Date', value: 'date' },
  { label: 'Sort by Score', value: 'score' },
  { label: 'Sort by Repository', value: 'repository' },
] as const;

export default function SortControl({
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setOpen(false);

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative z-[2000] select-none">
      <div className="flex items-center bg-[var(--gray-light)] rounded-full px-3 py-1.5 gap-2 cursor-pointer shadow-sm">
        {/* Main sort selector */}
        <button
          onClick={() => setOpen(!open)}
          className="text-sm text-[var(--text-primary)] flex items-center gap-1"
        >
          {OPTIONS.find((o) => o.value === sortBy)?.label}

          <svg
            className={`w-3 h-3 transition-transform duration-200 ${
              open ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border-color)]"></div>

        {/* ASC/DESC toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-1.5 rounded-full hover:bg-[var(--border-color)] transition-colors"
          aria-label={`Sort ${
            sortOrder === 'asc' ? 'ascending' : 'descending'
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              sortOrder === 'asc' ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 4v16m-6-6l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute mt-2 left-0 w-full bg-white border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden animate-fadeIn origin-top z-[3000]">
          {OPTIONS.map((option, index) => {
            const isSelected = sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-sm transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-[var(--blue-primary)] text-white'
                      : 'text-[var(--text-primary)] hover:bg-gray-100'
                  }
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === OPTIONS.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
