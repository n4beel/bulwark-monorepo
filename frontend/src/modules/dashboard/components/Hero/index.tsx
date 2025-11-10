// components/dashboard/DashboardHero.tsx (WITH TABS)
'use client';

import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import AnalysisModals from '@/shared/components/AnalysisModals';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import { GitHubFlowStep } from '@/shared/hooks/useGitHubFlow';
import { RootState } from '@/store/store';
import DashboardTabs from '../Tabs/DashboardTabs';

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
    const shouldOpenFlow = sessionStorage.getItem('open_github_flow');

    if (shouldOpenFlow === 'true') {
      sessionStorage.removeItem('open_github_flow');

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
