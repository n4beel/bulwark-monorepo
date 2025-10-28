// components/dashboard/DashboardHero.tsx (WITH TABS)
"use client";

import React from "react";
import DashboardHeroHeader from "./DashboardHeroHeader";

import { useAnalysisFlows } from "@/hooks/useAnalysisFlow";
import AnalysisModals from "@/components/AnalysisModals";
import DashboardTabs from "../DashboardTabs";

const DashboardHero = () => {
  // ALL state and logic is in the hook - no duplicates!
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();

  return (
    <>
      <DashboardHeroHeader />

      {/* Tabs Component */}
      <DashboardTabs handlers={handlers} />

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
