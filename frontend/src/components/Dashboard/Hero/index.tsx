// components/dashboard/DashboardHero.tsx (WITH TABS)
"use client";

import React, { useEffect } from "react";
import DashboardHeroHeader from "./DashboardHeroHeader";

import { useAnalysisFlows } from "@/hooks/useAnalysisFlow";
import AnalysisModals from "@/components/AnalysisModals";
import DashboardTabs from "../DashboardTabs";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { GitHubFlowStep } from "@/hooks/useGitHubFlow";

const DashboardHero = ({
  initialReportId,
}: {
  initialReportId: string | undefined;
}) => {
  // ALL state and logic is in the hook - no duplicates!
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();

  const { githubToken } = useSelector((state: RootState) => state.auth);

  // ✅ Check flag HERE where the modal is rendered
  useEffect(() => {
    const shouldOpenFlow = sessionStorage.getItem("open_github_flow");

    if (shouldOpenFlow === "true") {
      sessionStorage.removeItem("open_github_flow");

      if (githubToken) {
        githubFlow.handleAuthSuccess?.(githubToken);
        githubFlow.setStep?.(GitHubFlowStep.REPO_SELECT);
      }
    }
  }, [githubToken, githubFlow]);
  return (
    <>
      {/* Tabs Component */}
      <DashboardTabs handlers={handlers} initialReportId={initialReportId} />

      {/* All Modals - hook manages everything */}
      <AnalysisModals
        uploadFlow={uploadFlow}
        githubFlow={githubFlow}
        results={results}
      />
    </>
  );
};

export default DashboardHero;
