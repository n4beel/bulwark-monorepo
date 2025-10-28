"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
// Removed unused imports
import { StaticAnalysisReport } from "@/types/api";
import { staticAnalysisApi } from "@/services/api";
import StaticAnalysisReportDisplay from "@/components/StaticAnalysisReportDisplay";
import DashboardNavbar from "@/components/Dashboard/DashboardNavBar";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<StaticAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Report ID from params:", params);
    if (params.id) {
      loadReport(params.id as string);
    }
  }, [params.id]);

  const loadReport = async (reportId: string) => {
    try {
      setIsLoading(true);
      setError("");
      console.log("Loading report with ID:", reportId);
      // Get all reports and find the one with matching ID
      const report = await staticAnalysisApi.getReportById(reportId);

      if (report) {
        setReport(report);
      } else {
        setError("Report not found");
      }
    } catch (err) {
      setError("Failed to load report. Please try again.");
      console.error("Error loading report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleNewAnalysis = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Report not found
            </h2>
            <p className="text-gray-600 mb-4">
              The requested report could not be found.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="w-full ">
        <StaticAnalysisReportDisplay
          report={report}
          onBack={handleBack}
          onNewAnalysis={handleNewAnalysis}
        />
      </div>
    </div>
  );
}
