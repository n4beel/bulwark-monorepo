'use client';

import { useEffect } from 'react';
import AnalysisModals from '@/shared/components/AnalysisModals';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import { authApi } from '@/services/api';
import DashboardTabs from '../Tabs/DashboardTabs';

const DashboardHero = ({
  initialReportId,
}: {
  initialReportId: string | undefined;
}) => {
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();
  useEffect(() => {
    (async () => {
      try {
        const me = await authApi.getMe();
        console.log('Fetched user info on dashboard load:', { me });
      } catch (err) {}
    })();
  }, []);
  return (
    <>
      <DashboardTabs handlers={handlers} initialReportId={initialReportId} />

      <AnalysisModals
        uploadFlow={uploadFlow}
        githubFlow={githubFlow}
        results={results}
      />
    </>
  );
};

export default DashboardHero;
