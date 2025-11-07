'use client';

import { ArrowRight } from 'lucide-react';

interface AnalysisActionBarProps {
  count: number;
  onBack: () => void;
  onRun: () => void;
  backLabel?: string;
  runLabel?: string;
  className?: string;
}

export default function AnalysisActionBar({
  count,
  onBack,
  onRun,
  backLabel = 'Cancel',
  runLabel = 'Run Static Analysis',
  className = '',
}: AnalysisActionBarProps) {
  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-center mt-6 ${className}`}
    >
      <span className="text-sm text-[var(--text-secondary)]">
        {count > 0
          ? `Ready to analyze ${count} contract file${count !== 1 ? 's' : ''}`
          : ''}
      </span>

      <div className="flex gap-3 mt-2 md:mt-0">
        <button
          onClick={onBack}
          className="px-5 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--gray-light)] transition-colors cursor-pointer"
        >
          {backLabel}
        </button>

        <button
          onClick={onRun}
          disabled={count === 0}
          className={`px-6 py-2 rounded-lg font-medium flex items-center transition-colors ${
            count > 0
              ? 'bg-[var(--blue-primary)] text-white hover:bg-[var(--blue-hover)] cursor-pointer'
              : 'bg-gray-300 text-gray-700 cursor-not-allowed'
          }`}
        >
          {runLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}
