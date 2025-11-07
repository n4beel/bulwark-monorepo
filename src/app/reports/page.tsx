'use client';

import { staticAnalysisApi } from '@/services/api';
import { StaticAnalysisReport } from '@/types/api';
import { getScoreColor } from '@/utils';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface ReportsPageProps {
  onReportSelect?: (reportId: string) => void;
  onNewAnalysis?: () => void;
  embedded?: boolean;
}

const ReportsPage = ({
  onReportSelect,
  onNewAnalysis,
  embedded = false,
}: ReportsPageProps = {}) => {
  const [reports, setReports] = useState<StaticAnalysisReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<
    StaticAnalysisReport[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'repository'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError('');
      const reportsData = await staticAnalysisApi.getAllReports();
      setReports(reportsData);
      setFilteredReports(reportsData);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallScore = (report: StaticAnalysisReport): number => {
    const scores = report?.scores ?? {};
    const values = [
      scores.structural?.score,
      scores.security?.score,
      scores.systemic?.score,
      scores.economic?.score,
    ].filter((v) => typeof v === 'number' && !isNaN(v));

    if (values.length === 0) return 0;
    const total = values.reduce((sum, v) => sum + v, 0);
    return Number((total / values.length).toFixed(1));
  };

  const filterAndSortReports = useCallback(() => {
    // Filter reports
    const filtered = reports.filter(
      (report) =>
        report.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.framework.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort reports
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

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
          aValue = a.repository.toLowerCase();
          bValue = b.repository.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredReports(filtered);
  }, [reports, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortReports();
  }, [filterAndSortReports]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div  className=' w-[90%] lg:w-[85%] mx-auto'>
      <div className="mb-8">
        <h1 className="text-3xl font-normal text-gray-900 doto">
          Analysis Reports
        </h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

    <div className="bg-white p-0 mb-2 flex flex-wrap md:flex-nowrap items-start md:items-center justify-between w-full gap-4">

  {/* Left side (Search + Sort) */}
  <div className="flex flex-col md:flex-row gap-4 w-full md:w-[90%]">

    {/* Search */}
    <div className="w-full md:w-2/4">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search reports by repository, language, or framework..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {/* Sort Dropdown */}
    <div className="flex gap-2 w-full md:w-auto">
      <select
        value={sortBy}
        onChange={(e) =>
          setSortBy(e.target.value as 'date' | 'score' | 'repository')
        }
        className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
      >
        <option value="date">Sort by Date</option>
        <option value="score">Sort by Score</option>
        <option value="repository">Sort by Repository</option>
      </select>
    </div>
  </div>

  {/* Right side (Select All / Delete) */}
  <div className="flex items-center gap-2 text-sm whitespace-nowrap w-full md:w-auto md:text-right">
    <span className="font-normal text-[var(--blue-primary)] cursor-pointer">
      Select All
    </span>
    <span className="font-normal text-red-600 cursor-pointer">
      Delete
    </span>
  </div>
</div>


      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No reports match your search criteria.'
                : "You haven't generated any analysis reports yet."}
            </p>
            <button
              onClick={onNewAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          filteredReports.map((report) => (
           <div
  key={
    // @ts-ignore
    typeof report._id === 'string' ? report._id : report._id.$oid
  }
  onClick={() =>
    onReportSelect?.(
      typeof report._id === 'string'
        ? report._id
        : // @ts-ignore
          report._id.$oid,
    )
  }
  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
>
  {/* ✅ Make card responsive */}
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    
    {/* Left Section */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Image
          src="/icons/Code.svg"
          alt="code"
          width={20}
          height={20}
          className="flex-shrink-0"
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
        Created {formatDate(report.createdAt)}
      </div>
    </div>

    {/* Right Section (Score) */}
    <div className="flex flex-row sm:flex-col sm:items-end justify-between sm:justify-start gap-2 text-right">
      <div className='flex items-center gap-2'>

      <span className="text-sm text-gray-600 whitespace-nowrap">
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

      <span className="text-sm text-[var(--blue-primary)] flex items-center whitespace-nowrap">
        view details
        <Image
          src="/icons/ArrowRightDotted.svg"
          alt="arrowright"
          width={10}
          height={10}
          className="ml-2"
        />
      </span>
    </div>
  </div>
</div>

          ))
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
