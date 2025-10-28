"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Download,
} from "lucide-react";
import { StaticAnalysisReport } from "@/types/api";
import { staticAnalysisApi } from "@/services/api";
import StaticAnalysisReportDisplay from "@/components/StaticAnalysisReportDisplay";
import ExportModal from "@/components/ExportModal";
import { getScoreColor } from "@/utils";

interface ReportsPageProps {
  onReportSelect?: (reportId: string) => void;
  onNewAnalysis?: () => void;
  embedded?: boolean; // To know if it's embedded in dashboard
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
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "repository">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError("");
      const reportsData = await staticAnalysisApi.getAllReports();
      setReports(reportsData);
      setFilteredReports(reportsData);
    } catch (err) {
      setError("Failed to load reports. Please try again.");
      console.error("Error loading reports:", err);
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
    ].filter((v) => typeof v === "number" && !isNaN(v));

    if (values.length === 0) return 0;
    const total = values.reduce((sum, v) => sum + v, 0);
    return Number((total / values.length).toFixed(1));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
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
    <div>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
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
                typeof report._id === "string" ? report._id : report._id.$oid
              }
              onClick={() =>
                onReportSelect?.(
                  typeof report._id === "string"
                    ? report._id
                    : // @ts-ignore
                      report._id.$oid
                )
              }
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {report.repository}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                      {report.language?.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded">
                      {report.framework}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Created {formatDate(report.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${getScoreColor(
                      getOverallScore(report)
                    )}`}
                  >
                    {getOverallScore(report)}
                  </div>
                  <span className="text-sm text-gray-600">Overall Score</span>
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
