'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Calendar,
    Code2,
    ArrowLeft,
    Search,
    Clock,
    Shield,
    Database,
    DollarSign,
    Layers,
    X,
    Download
} from 'lucide-react';
import { StaticAnalysisReport } from '@/types/api';
import { staticAnalysisApi } from '@/services/api';
import StaticAnalysisReportDisplay from '@/components/StaticAnalysisReportDisplay';
import ExportModal from '@/components/ExportModal';

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<StaticAnalysisReport[]>([]);
    const [filteredReports, setFilteredReports] = useState<StaticAnalysisReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'repository'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedReport, setSelectedReport] = useState<StaticAnalysisReport | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            setError('');
            const reportsData = await staticAnalysisApi.getAllReports();
            setReports(reportsData);
        } catch (err) {
            setError('Failed to load reports. Please try again.');
            console.error('Error loading reports:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filterAndSortReports = useCallback(() => {
        const filtered = reports.filter(report =>
            report.repository.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.framework.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort reports
        filtered.sort((a, b) => {
            let aValue: string | number | Date, bValue: string | number | Date;

            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.createdAt.$date);
                    bValue = new Date(b.createdAt.$date);
                    break;
                case 'score':
                    aValue = (a.scores.structural + a.scores.security + a.scores.systemic + a.scores.economic) / 4;
                    bValue = (b.scores.structural + b.scores.security + b.scores.systemic + b.scores.economic) / 4;
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
        loadReports();
    }, []);

    useEffect(() => {
        filterAndSortReports();
    }, [filterAndSortReports]);

    const getScoreColor = (score: number) => {
        if (score <= 20) return 'text-green-600 bg-green-100';
        if (score <= 40) return 'text-yellow-600 bg-yellow-100';
        if (score <= 60) return 'text-orange-600 bg-orange-100';
        return 'text-red-600 bg-red-100';
    };

    const getOverallScore = (report: StaticAnalysisReport) => {
        return ((report.scores.structural + report.scores.security + report.scores.systemic + report.scores.economic) / 4).toFixed(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleReportClick = (report: StaticAnalysisReport) => {
        // Show report details in modal/overlay
        setSelectedReport(report);
    };

    const handleCloseReport = () => {
        setSelectedReport(null);
    };

    const handleNewAnalysis = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading reports...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to Analysis
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Analysis Reports</h1>
                                <p className="text-gray-600 mt-1">
                                    View and manage your static analysis reports
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowExportModal(true)}
                                disabled={reports.length === 0}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </button>
                            <div className="text-sm text-gray-500">
                                {filteredReports.length} of {reports.length} reports
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {/* Search and Filter Controls */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search reports by repository, language, or framework..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'repository')}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="score">Sort by Score</option>
                                <option value="repository">Sort by Repository</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                    {filteredReports.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm ? 'No reports match your search criteria.' : 'You haven\'t generated any analysis reports yet.'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => router.push('/')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Start New Analysis
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div
                                key={typeof report._id === 'string' ? report._id : report._id.$oid}
                                onClick={() => handleReportClick(report)}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <Code2 className="w-5 h-5 text-blue-600 mr-2" />
                                            <h3 className="text-xl font-semibold text-gray-900">{report.repository}</h3>
                                            <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                                                {report.language.toUpperCase()}
                                            </span>
                                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                                                {report.framework}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="flex items-center">
                                                <Layers className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm text-gray-600">Structural</div>
                                                    <div className={`text-sm font-medium ${getScoreColor(report.scores.structural).split(' ')[0]}`}>
                                                        {report.scores.structural.toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm text-gray-600">Security</div>
                                                    <div className={`text-sm font-medium ${getScoreColor(report.scores.security).split(' ')[0]}`}>
                                                        {report.scores.security.toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Database className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm text-gray-600">Systemic</div>
                                                    <div className={`text-sm font-medium ${getScoreColor(report.scores.systemic).split(' ')[0]}`}>
                                                        {report.scores.systemic.toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm text-gray-600">Economic</div>
                                                    <div className={`text-sm font-medium ${getScoreColor(report.scores.economic).split(' ')[0]}`}>
                                                        {report.scores.economic.toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            <span>Created {formatDate(report.createdAt.$date)}</span>
                                            <Clock className="w-4 h-4 ml-4 mr-1" />
                                            <span>Analysis time: {(report.performance.analysisTime / 1000).toFixed(2)}s</span>
                                        </div>
                                    </div>

                                    <div className="ml-6 text-right">
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600">Overall Score</span>
                                            <div className={`text-2xl font-bold ${getScoreColor(parseFloat(getOverallScore(report))).split(' ')[0]}`}>
                                                {getOverallScore(report)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {report.analysisFactors.totalLinesOfCode.toLocaleString()} LOC
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <ExportModal
                    reports={reports}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                    <div className="min-h-screen flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                                <button
                                    onClick={handleCloseReport}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                                <StaticAnalysisReportDisplay
                                    report={selectedReport}
                                    onBack={handleCloseReport}
                                    onNewAnalysis={handleNewAnalysis}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
