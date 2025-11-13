// components/dashboard/DashboardTabs.tsx
'use client';

import StaticAnalysisReportDisplay from '@/components/StaticAnalysisReportDisplay';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import ReportsPage from '@/app/reports/page';
import RepoInputSection from '@/shared/components/RepoInputSection';
import { useAppSelector } from '@/shared/hooks/useAppSelector';
import { setOpenGithubAuthModal } from '@/store/slices/appSlice';
import { RootState } from '@/store/store';
import { staticAnalysisApi } from '@/services/api';
import { StaticAnalysisReport } from '@/types/api';
import DashboardHeroHeader from '../Hero/DashboardHeroHeader';

interface DashboardTabsProps {
  handlers: {
    onConnectGitHub: (redirectPath?: string, mode?: 'auth' | 'connect') => void;
    onUploadZip: () => void;
    onAnalyze: (input: string) => void;
  };
  initialReportId?: string;
}
enum Tab {
  ANALYZE = 'analyze',
  REPORTS = 'reports',
  MARKETPLACE = 'marketplace',
  REPORT_DETAIL = 'report_detail', // New tab state for report details
}

const TAB_CONFIG = [
  { id: Tab.REPORTS, label: 'Reports', icon: '' },
  { id: Tab.ANALYZE, label: 'Analyze', icon: '/icons/SearchIcon.svg' },
  {
    id: Tab.MARKETPLACE,
    label: 'Marketplace',
    icon: '',
  },
];

const DashboardTabs = ({ handlers, initialReportId }: DashboardTabsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.REPORTS);
  const [selectedReport, setSelectedReport] =
    useState<StaticAnalysisReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const dispatch = useDispatch();

  const githubId = useAppSelector((state: RootState) => state.auth.githubId);

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
      console.error('Error loading report:', err);
      setSelectedReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleBackToReports = () => {
    setSelectedReport(null);
    setActiveTab(Tab.REPORTS);
    // replace router with dashboard url without report param
    window.history.replaceState({}, '', '/dashboard');
  };

  const handleNewAnalysis = () => {
    setActiveTab(Tab.ANALYZE);
  };
  const dashboardHandlers = {
    onConnectGitHub: () => {
      // ✅ If GitHub already connected
      if (githubId) {
        dispatch(setOpenGithubAuthModal(true)); // This triggers the modal
      } else {
        // ✅ If not connected, do OAuth
        handlers.onConnectGitHub('/dashboard', 'connect');
      }
    },
    onUploadZip: handlers.onUploadZip,
    onAnalyze: handlers.onAnalyze,
  };

  // // Modified ReportsPage wrapper to handle report selection

  return (
    <div
      className="
  relative w-full 

  mx-auto px-0 min-h-[600px] pt-0
"
    >
      {activeTab !== Tab.REPORT_DETAIL && <DashboardHeroHeader />}
      <div className="py-12 h-full overflow-y-auto pb-28">
        {activeTab === Tab.ANALYZE && (
          <div className="w-full max-w-[95%] md:max-w-[90%] xxl:max-w-[80%] mx-auto">
            <RepoInputSection
              onConnectGitHub={dashboardHandlers.onConnectGitHub} // ✅ Uses "connect" mode
              onUploadZip={dashboardHandlers.onUploadZip}
              onAnalyze={dashboardHandlers.onAnalyze}
              showStats={false}
              compact={true}
              githubConnected={!!githubId}
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
              style={{ color: 'var(--text-primary)' }}
            >
              Marketplace
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Coming Soon</p>
          </div>
        )}
      </div>
      {/* Tabs - Only show main tabs, hide when viewing detail */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full flex justify-center z-50 pointer-events-none">
        <div
          className="
      pointer-events-auto
      relative inline-flex rounded-full overflow-hidden
      border border-[#A8C3FF]
      shadow-[0_17px_25px_rgba(107,134,194,0.32)]
      bg-white/40 backdrop-blur-xl

      /* ✅ Width stays centered */
      max-w-[90%] md:max-w-none
    "
        >
          {/* ✅ Animated GIF Background */}
          <img
            src="/videos/DockNavGIF.gif"
            alt="dock background"
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          />

          {/* ✅ Content — Responsive padding */}
          <div
            className="
        relative z-20 flex gap-2 rounded-full
        p-2 md:p-2 lg:p-2
      "
          >
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== Tab.MARKETPLACE) setActiveTab(tab.id);
                  window.history.replaceState({}, '', '/dashboard');
                }}
                disabled={tab.id === Tab.MARKETPLACE}
                className={`
            rounded-full font-normal transition-all text-nowrap

            /* ✅ Responsive sizing */
            px-3 py-2 text-xs
            sm:px-4 sm:py-2.5 sm:text-sm
            md:px-5 md:py-3 md:text-sm
            lg:px-6 lg:py-3 lg:text-base

            ${
              tab.id === Tab.MARKETPLACE
                ? 'cursor-not-allowed opacity-50 text-[var(--gray-medium)]'
                : 'cursor-pointer'
            }
            ${
              activeTab === tab.id ||
              (activeTab === Tab.REPORT_DETAIL && tab.id === Tab.REPORTS)
                ? 'bg-[var(--blue-primary)] text-white'
                : 'text-[var(--gray-medium)]'
            }
          `}
              >
                <div className="flex items-center gap-2">
                  {tab.icon && (
                    <Image
                      src={tab.icon}
                      alt={tab.label}
                      width={18}
                      height={18}
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
