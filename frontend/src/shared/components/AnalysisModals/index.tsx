'use client';

import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import ReceiptModal from '@/shared/components/Receipt/Receipt';
import UploadFlowModal from '@/shared/components/uploadFlow/UploadFlowModal';
import GitHubFlowModal from '@/shared/components/UploadGihubFlow/GitHubModalFlow';
import { useAppSelector } from '@/shared/hooks/useAppSelector';
import { GitHubFlowStep } from '@/shared/hooks/useGitHubFlow';
import { setOpenGithubAuthModal } from '@/store/slices/appSlice';

interface AnalysisModalsProps {
  uploadFlow: any;
  githubFlow: any;
  results: any;
}
export default function AnalysisModals({
  uploadFlow,
  githubFlow,
  results,
}: AnalysisModalsProps) {
  const { handleAuthSuccess, setStep } = githubFlow;
  const { openGithubAuthModal } = useAppSelector((state) => state.app);
  const { githubToken } = useAppSelector((state) => state.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    const isAnyOpen =
      uploadFlow.isOpen ||
      githubFlow.step !== GitHubFlowStep.AUTH ||
      results.isOpen;

    document.body.style.overflow = isAnyOpen ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [uploadFlow.isOpen, githubFlow.step, results.isOpen]);

  useEffect(() => {
    if (openGithubAuthModal) {
      sessionStorage.removeItem('open_github_flow');
      dispatch(setOpenGithubAuthModal(false));

      if (githubToken) {
        handleAuthSuccess(githubToken);
        setStep(GitHubFlowStep.REPO_SELECT);
      }
    }
  }, [handleAuthSuccess, setStep, githubToken]);

  return (
    <>
      {uploadFlow.isOpen && (
        <UploadFlowModal
          step={uploadFlow.step}
          contractFiles={uploadFlow.contractFiles}
          startFileSelect={uploadFlow.startFileSelect}
          runAnalysis={uploadFlow.runAnalysis}
          report={uploadFlow.report}
          apiReady={!uploadFlow.isAnalyzing}
          goToPreviousStep={uploadFlow.goToPreviousStep}
          completeAnalysis={uploadFlow.completeAnalysis}
          onClose={() => {
            uploadFlow.resetFlow();
            uploadFlow.setOpen(false);
          }}
          onOpenResults={(r: any) => {
            results.setReport(r);
            results.setOpen(true);
          }}
        />
      )}

      <GitHubFlowModal
        step={githubFlow.step}
        accessToken={githubFlow.accessToken}
        onClose={() => {
          githubFlow.resetFlow();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('github_token');
          }
          document.body.style.overflow = 'auto';
        }}
        selectedRepo={githubFlow.selectedRepo}
        contractFiles={githubFlow.contractFiles}
        selectRepository={githubFlow.selectRepository}
        runAnalysis={githubFlow.runAnalysis}
        apiReady={!githubFlow.isAnalyzing}
        completeAnalysis={githubFlow.completeAnalysis}
        onOpenResults={(report: any) => {
          results.setReport(report);
          results.setOpen(true);
        }}
        report={githubFlow.report}
      />

      <ReceiptModal
        open={results.isOpen}
        report={results.report}
        onClose={() => results.setOpen(false)}
      />
    </>
  );
}
