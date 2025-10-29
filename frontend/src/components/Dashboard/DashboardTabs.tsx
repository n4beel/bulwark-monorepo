// components/dashboard/DashboardTabs.tsx
"use client";

import React, { useState, useEffect } from "react";
import RepoInputSection from "@/components/RepoInputSection";
import Image from "next/image";
import ReportsPage from "@/app/reports/page";
import StaticAnalysisReportDisplay from "@/components/StaticAnalysisReportDisplay";
import { staticAnalysisApi } from "@/services/api";
import { StaticAnalysisReport } from "@/types/api";
import DashboardHeroHeader from "./Hero/DashboardHeroHeader";

interface DashboardTabsProps {
  handlers: {
    onConnectGitHub: () => void;
    onUploadZip: () => void;
    onAnalyze: (input: string) => void;
  };
  initialReportId?: string; // Pass this from URL params if needed
}

enum Tab {
  ANALYZE = "analyze",
  REPORTS = "reports",
  MARKETPLACE = "marketplace",
  REPORT_DETAIL = "report_detail", // New tab state for report details
}

const TAB_CONFIG = [
  { id: Tab.REPORTS, label: "Reports", icon: "" },
  { id: Tab.ANALYZE, label: "Analyze", icon: "/icons/SearchIcon.svg" },
  {
    id: Tab.MARKETPLACE,
    label: "Marketplace",
    icon: "",
  },
];

const DashboardTabs = ({ handlers, initialReportId }: DashboardTabsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REPORTS);
  const [selectedReport, setSelectedReport] =
    useState<StaticAnalysisReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load initial report if ID provided (from URL)
  useEffect(() => {
    if (initialReportId) {
      handleReportSelect(initialReportId);
    }
  }, [initialReportId]);

  const handleReportSelect = async (reportId: string) => {
    try {
      setLoadingReport(true);
      const report = await staticAnalysisApi.getReportById(reportId);
      setSelectedReport(report);
      setActiveTab(Tab.REPORT_DETAIL);
    } catch (err) {
      console.error("Error loading report:", err);
      setSelectedReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
    setActiveTab(Tab.REPORTS);
  };

  const handleNewAnalysis = () => {
    setActiveTab(Tab.ANALYZE);
  };

  // // Modified ReportsPage wrapper to handle report selection

  return (
    <div
      className="
  relative w-full 
  max-w-[95%]         /* default mobile */
  sm:max-w-[90%]      /* small screens */
  md:max-w-[90%]      /* medium screens */
  lg:max-w-[90%]      /* large screens */
  xl:max-w-[90%]      /* extra large screens */
  2xl:max-w-[80%]     /* ultra wide screens */
  mx-auto px-6 min-h-[600px] pt-0
"
    >
      {activeTab !== Tab.REPORT_DETAIL && <DashboardHeroHeader />}
      <div className="py-12 h-full overflow-y-auto pb-28">
        {activeTab === Tab.ANALYZE && (
          <div className="w-4/6 mx-auto">
            <RepoInputSection
              onConnectGitHub={handlers.onConnectGitHub}
              onUploadZip={handlers.onUploadZip}
              onAnalyze={handlers.onAnalyze}
              showStats={false}
              compact={true}
            />
          </div>
        )}

        {activeTab === Tab.REPORTS && (
          <ReportsPage
            onReportSelect={handleReportSelect}
            onNewAnalysis={handleNewAnalysis}
            embedded={true}
          />
        )}

        {activeTab === Tab.REPORT_DETAIL &&
          (loadingReport ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Loading report details...
              </span>
            </div>
          ) : selectedReport ? (
            <StaticAnalysisReportDisplay
              report={selectedReport}
              onBack={handleBackToReports}
              onNewAnalysis={handleNewAnalysis}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-red-600">Report not found</p>
              <button
                onClick={handleBackToReports}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to Reports
              </button>
            </div>
          ))}

        {activeTab === Tab.MARKETPLACE && (
          <div className="bg-white/90 backdrop-blur rounded-2xl p-8">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Marketplace
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>Coming Soon</p>
          </div>
        )}
      </div>

      {/* Tabs - Only show main tabs, hide when viewing report details */}

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <div className="relative inline-flex rounded-full overflow-hidden border border-[#A8C3FF] shadow-[0_17px_25px_rgba(107,134,194,0.32)]">
          {/* ✅ GIF BACKGROUND */}
          <img
            src={"videos/DockNavGif.gif"}
            alt="Animated background"
            className="absolute w-full h-full object-cover  z-0 pointer-events-none"
          />
          {/* Buttons (content stays same) */}
          <div className="relative z-20 flex gap-2 rounded-full p-2 bg-white/40">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== Tab.MARKETPLACE) setActiveTab(tab.id);
                }}
                disabled={tab.id === Tab.MARKETPLACE}
                className={`px-6 py-3 rounded-full font-normal transition-all 
    ${
      tab.id === Tab.MARKETPLACE
        ? "cursor-not-allowed opacity-50 text-[var(--gray-medium)]"
        : "cursor-pointer"
    } 
    ${
      activeTab === tab.id ||
      (activeTab === Tab.REPORT_DETAIL && tab.id === Tab.REPORTS)
        ? "bg-[var(--blue-primary)] text-white"
        : "text-[var(--gray-medium)]"
    }`}
              >
                <div className="flex items-center gap-2">
                  {tab.icon && (
                    <Image
                      src={tab.icon}
                      alt={tab.label}
                      width={20}
                      height={20}
                      className={activeTab === tab.id ? " text-white" : ""}
                    />
                  )}
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTabs;
