'use client';

import AnalysisModals from '@/shared/components/AnalysisModals';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import DashboardTabs from '../Tabs/DashboardTabs';

const DashboardHero = ({
  initialReportId,
}: {
  initialReportId: string | undefined;
}) => {
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();

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
