'use client';

import { getScoreColor } from '@/utils';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { staticAnalysisApi } from '@/services/api';
import { StaticAnalysisReport } from '@/types/api';

interface ReportsPageProps {
  onReportSelect?: (reportId: string) => void;
  onNewAnalysis?: () => void;
  embedded?: boolean;
}

const getId = (r: StaticAnalysisReport): string => {
  if (!r || !r._id) return '';
  if (typeof r._id === 'string') return r._id;
  if (typeof (r._id as any).$oid === 'string') return (r._id as any).$oid;
  return String(r._id);
};

export default function ReportsPage({
  onReportSelect,
  onNewAnalysis,
  embedded = false,
}: ReportsPageProps) {
  const [reports, setReports] = useState<StaticAnalysisReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<
    StaticAnalysisReport[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'repository'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    void loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await staticAnalysisApi.getAllReports();
      setReports(data);
      setFilteredReports(data);
    } catch {
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallScore = (r: StaticAnalysisReport): number => {
    const s = r?.scores ?? {};
    const vals = [
      s.structural?.score,
      s.security?.score,
      s.systemic?.score,
      s.economic?.score,
    ].filter((v): v is number => typeof v === 'number' && !isNaN(v));
    if (!vals.length) return 0;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  };

  const filterAndSortReports = useCallback(() => {
    const filtered = reports.filter(
      (r) =>
        r.repository?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.framework?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let aValue: number | string | Date;
      let bValue: number | string | Date;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'score':
          aValue = getOverallScore(a);
          bValue = getOverallScore(b);
          break;
        case 'repository':
          aValue = a.repository?.toLowerCase();
          bValue = b.repository?.toLowerCase();
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortReports();
  }, [filterAndSortReports]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === filteredReports.length
        ? []
        : filteredReports.map((r) => getId(r)),
    );
  const handleDeleteReports = async () => {
    setShowDeleteModal(false);
    try {
      await staticAnalysisApi.deleteReports(selectedIds);

      // ✅ Update state to remove deleted reports
      setReports((prev) => prev.filter((r) => !selectedIds.includes(getId(r))));
      setFilteredReports((prev) =>
        prev.filter((r) => !selectedIds.includes(getId(r))),
      );
      setSelectedIds([]);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete reports. Please try again.');
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );

  return (
    <div className="w-[90%] lg:w-[85%] mx-auto relative">
      <div className="mb-8">
        <h1 className="text-3xl font-normal text-gray-900">Analysis Reports</h1>
      </div>

      {/* Top Controls */}
      <div className="bg-white flex flex-wrap md:flex-nowrap items-center justify-between w-full gap-4 p-3 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-[90%]">
          <div className="relative w-full md:w-2/4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'date' | 'score' | 'repository')
            }
            className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
            <option value="repository">Sort by Repository</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-sm whitespace-nowrap w-full md:w-auto justify-end">
          <span
            onClick={selectAll}
            className="font-normal text-[var(--blue-primary)] cursor-pointer"
          >
            {selectedIds.length === filteredReports.length
              ? 'Unselect All'
              : 'Select All'}
          </span>
          <span
            onClick={() => selectedIds.length && setShowDeleteModal(true)}
            className={`font-normal ${
              selectedIds.length > 0
                ? 'text-red-600 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Delete
          </span>
        </div>
      </div>

      {/* Reports */}
      <div className="space-y-4 mt-4">
        {filteredReports.map((report) => {
          const id = getId(report);
          const selected = selectedIds.includes(id);
          return (
            <div
              key={id}
              className={`bg-white rounded-xl shadow-sm border p-6 relative transition-all cursor-pointer ${
                selected
                  ? 'border-[var(--blue-primary)] ring-1 ring-[var(--blue-primary)]'
                  : 'border-gray-200 hover:shadow-md hover:border-blue-300'
              }`}
              onClick={() => onReportSelect?.(id)}
            >
              {/* Report Card with aligned checkbox */}
              <div className="flex items-start gap-3">
                {/* Checkbox - aligned with heading */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(id);
                  }}
                  className="flex-shrink-0 w-5 h-5 rounded border-[2px] border-[var(--blue-primary)] flex items-center justify-center cursor-pointer transition-colors mt-1"
                >
                  {selected && (
                    <svg
                      className="w-3 h-3 text-[var(--blue-primary)]"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/icons/Code.svg"
                        alt="code"
                        width={20}
                        height={20}
                      />
                      <h3 className="text-xl font-normal truncate">
                        {report.repository}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-1 bg-gray-100 font-normal text-[var(--blue-primary)] text-sm rounded">
                        {report.language?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Created{' '}
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Overall Score
                      </span>
                      <span
                        className={`text-2xl font-normal px-2 py-0 rounded-lg inline-block ${getScoreColor(
                          getOverallScore(report),
                        )}`}
                      >
                        {getOverallScore(report)}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--blue-primary)] flex items-center whitespace-nowrap mt-2">
                      view details
                      <Image
                        src="/icons/ArrowRightDotted.svg"
                        alt="arrow"
                        width={10}
                        height={10}
                        className="ml-2"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Modal */}
      {/* Delete Modal */}
      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(false);
          }}
        >
          <div
            className="bg-[var(--background)] border border-[var(--overlay-border)] rounded-2xl shadow-2xl p-8 w-[90%] max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">
              Confirm Delete
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Delete {selectedIds.length} selected report
              {selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 border border-[var(--border-color)] rounded-md hover:bg-gray-100 text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteReports();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
