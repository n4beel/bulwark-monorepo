"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StaticAnalysisReportDisplay from "@/components/StaticAnalysisReportDisplay";
import { staticAnalysisApi } from "@/services/api";
import { StaticAnalysisReport } from "@/types/api";

export default function ReportSummaryPage() {
  const { id } = useParams();
  const router = useRouter();

  const [report, setReport] = useState<StaticAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        setLoading(true);
        const report = await staticAnalysisApi.getReportById(id as string);
        setReport(report);
      } catch (err) {
        console.error("Error loading report:", err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">
          Loading detailed report…
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-10 text-red-600">
        Report not found — maybe removed?
        <button
          onClick={() => router.push("/reports")}
          className="ml-3 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <StaticAnalysisReportDisplay
      report={report}
      onBack={() => router.push("/reports")}
      onNewAnalysis={() => router.push("/")}
    />
  );
}
