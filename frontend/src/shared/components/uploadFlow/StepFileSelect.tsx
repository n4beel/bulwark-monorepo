'use client';

import { FileText, Search } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import AnalysisActionBar from '../AnalysisActionBar/AnalysisActionBar';

interface Props {
  contractFiles: any[];
  onExecute: (files: string[]) => void;
  onBack: () => void;
}

export default function StepFileSelect({
  contractFiles,
  onExecute,
  onBack,
}: Props) {
  const [selected, setSelected] = useState(
    new Set(contractFiles.map((f) => f.path)),
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (p: string) => {
    const s = new Set(selected);
    s.has(p) ? s.delete(p) : s.add(p);
    setSelected(s);
  };

  const selectAll = () => {
    setSelected(new Set(contractFiles.map((f) => f.path)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const filteredFiles = contractFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const allSelected = selected.size === contractFiles.length;

  return (
    <div
      className="
    flex flex-col justify-between
  h-full
    px-0 py-2
   
    overflow-y- md:overflow-hidden

    sm:px-6
    max-[420px]:px-0 

   
  "
    >
      {/* Header */}
      <div className="">
        {/* Success Message */}
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
            ✓
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              Upload Successful
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {contractFiles.length} contract files found in uploaded archive
            </p>
          </div>
        </div>

        <h2 className="text-[20px] font-normal text-[var(--text-primary)] mb-2">
          Select Files to Include in the scan
        </h2>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search contract files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-primary text-sm"
          />
        </div>

        {/* Select All / Deselect All */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4 text-sm">
            <button
              onClick={selectAll}
              className={`hover:underline cursor-pointer ${
                allSelected
                  ? 'text-[var(--blue-primary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className={`hover:underline cursor-pointer ${
                !allSelected
                  ? 'text-[var(--blue-primary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              Deselect All
            </button>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            {selected.size} of {contractFiles.length} files selected
          </span>
        </div>

        {/* File List */}
        <div className="border border-[var(--border-color)] rounded-xl overflow-hidden max-h-[180px]  md:max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[var(--blue-primary)] [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredFiles.map((file, index) => (
            <div
              key={file.path}
              className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                index !== filteredFiles.length - 1
                  ? 'border-b border-[var(--border-color)]'
                  : ''
              }`}
              onClick={() => toggle(file.path)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Custom Checkbox */}
                <div
                  className={`w-5 h-5 flex-shrink-0 rounded border-[2px] flex items-center justify-center cursor-pointer transition-colors
                    border-[var(--blue-primary)]
                  `}
                >
                  {selected.has(file.path) && (
                    <svg
                      className="w-3 h-3 text-[var(--blue-primary)]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>

                {/* File Icon */}
                <FileText className="w-5 h-5 flex-shrink-0 text-[var(--blue-primary)]" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                      {file.name}
                    </p>
                    {file.language && (
                      <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
                        {file.language}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {file.path}
                  </p>
                </div>
              </div>

              {/* File Size */}
              <span className="text-xs text-[var(--text-secondary)] ml-4 flex-shrink-0">
                {formatFileSize(file.size || 0)}
              </span>
            </div>
          ))}
        </div>

        {/* Info Message */}
        <div className="mt-4 flex items-start gap-2">
          <Image
            src="/icons/InfoIcon.svg"
            alt="info"
            width={16}
            height={16}
            className="w-4 h-4 mt-0.5 flex-shrink-0"
          />
          <p className="text-xs text-[var(--text-secondary)]">
            The files above are only the .rs files found in the archive
            uploaded. Any other files/documentation/test etc. will be utilized
            for security heuristics identification.
          </p>
        </div>
      </div>

      {/* Footer */}
      <AnalysisActionBar
        count={selected.size}
        onBack={onBack}
        onRun={() => onExecute(Array.from(selected))}
        backLabel="Back"
        runLabel="Run Static Analysis →"
      />
    </div>
  );
}
