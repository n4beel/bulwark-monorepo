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
      setLoading(true);

      try {
        const allReports = await staticAnalysisApi.getAllReports();
        const found = allReports.find((r) => {
          const oid = typeof r._id === "string" ? r._id : r._id?.$oid;
          return oid === id;
        });
        setReport(found ?? null);
      } catch (err) {
        console.error("Error loading report:", err);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-gray-600">Loading detailed report…</div>;
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
