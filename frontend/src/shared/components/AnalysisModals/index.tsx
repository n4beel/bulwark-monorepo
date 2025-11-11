'use client';

import { useEffect } from 'react';
import ReceiptModal from '@/shared/components/Receipt/Receipt';
import UploadFlowModal from '@/shared/components/uploadFlow/UploadFlowModal';
import GitHubFlowModal from '@/shared/components/UploadGihubFlow/GitHubModalFlow';

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
  useEffect(() => {
    const isAnyModalOpen =
      uploadFlow.isOpen || githubFlow.isOpen || results.isOpen;

    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [uploadFlow.isOpen, githubFlow.isOpen, results.isOpen]);

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

      {githubFlow.isOpen && (
        <GitHubFlowModal
          step={githubFlow.step}
          accessToken={githubFlow.accessToken}
          selectedRepo={githubFlow.selectedRepo}
          contractFiles={githubFlow.contractFiles}
          selectRepository={githubFlow.selectRepository}
          runAnalysis={githubFlow.runAnalysis}
          apiReady={!githubFlow.isAnalyzing}
          completeAnalysis={githubFlow.completeAnalysis}
          onClose={githubFlow.resetFlow}
          report={githubFlow.report}
          onOpenResults={(r: any) => {
            results.setReport(r);
            results.setOpen(true);
          }}
        />
      )}

      <ReceiptModal
        open={results.isOpen}
        report={results.report}
        onClose={() => results.setOpen(false)}
      />
    </>
  );
}
