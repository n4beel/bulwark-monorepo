'use client';

import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import AnalysisModals from '@/shared/components/AnalysisModals';
import { useAnalysisFlows } from '@/shared/hooks/useAnalysisFlow';
import { setGithubId } from '@/store/slices/authSlice';
import { authApi } from '@/services/api';
import DashboardTabs from '../Tabs/DashboardTabs';

const DashboardHero = ({
  initialReportId,
}: {
  initialReportId: string | undefined;
}) => {
  const { uploadFlow, githubFlow, results, handlers } = useAnalysisFlows();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      try {
        const response = await authApi.getMe();
        const githubId = response.me?.githubId || null;
        dispatch(setGithubId(githubId));
      } catch (err) {
        console.log('Auth check failed (user not logged in yet)', err);
      }
    })();
  }, [dispatch]);

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
