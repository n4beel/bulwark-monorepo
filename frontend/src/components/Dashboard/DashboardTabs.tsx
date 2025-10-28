// components/dashboard/DashboardTabs.tsx
"use client";

import React, { useState } from "react";
import RepoInputSection from "@/components/RepoInputSection";
import Image from "next/image";
import ReportsPage from "@/app/reports/page";

interface DashboardTabsProps {
  handlers: {
    onConnectGitHub: () => void;
    onUploadZip: () => void;
    onAnalyze: (input: string) => void;
  };
}

enum Tab {
  ANALYZE = "analyze",
  REPORTS = "reports",
  MARKETPLACE = "marketplace",
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

const DashboardTabs = ({ handlers }: DashboardTabsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REPORTS);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-6 min-h-[600px] pt-8">
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

        {activeTab === Tab.REPORTS && <ReportsPage />}

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

      {/* Tabs - Bottom Center with Video Background */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <div className="relative isolate inline-flex rounded-full overflow-hidden">
          {/* 1) VIDEO (back) */}
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0 pointer-events-none"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/BulwarkSearchBg.webm" type="video/webm" />
            <source src="/videos/BulwarkSearchBg.mp4" type="video/mp4" />
          </video>

          {/* 2) (optional) soft tint */}
          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10" />

          {/* 3) CONTENT (front) — gives the wrapper its size */}
          <div className="relative z-20 flex gap-2 rounded-full p-2 bg-white/40 backdrop-blur-md">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-normal cursor-pointer transition-all ${
                  activeTab === tab.id
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
                      className={
                        activeTab === tab.id ? "invert text-white " : ""
                      }
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
