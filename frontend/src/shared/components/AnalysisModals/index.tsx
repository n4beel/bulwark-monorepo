// components/shared/AnalysisModals.tsx (SIMPLE VERSION)
'use client';

import ReceiptModal from '@/shared/components/Receipt/Receipt';
import UploadFlowModal from '@/shared/components/uploadFlow/UploadFlowModal';
import GitHubFlowModal from '@/shared/components/UploadGihubFlow/GitHubModalFlow';

interface AnalysisModalsProps {
  uploadFlow: any;
  githubFlow: any;
  results: any;
}

const AnalysisModals = ({
  uploadFlow,
  githubFlow,
  results,
}: AnalysisModalsProps) => {
  return (
    <>
      {/* Upload Flow Modal */}
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
            document.body.style.overflow = 'auto';
          }}
          onOpenResults={(r: any) => {
            results.setReport(r);
            results.setOpen(true);
          }}
        />
      )}

      {/* GitHub Flow Modal */}

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

      {/* Results/Receipt Modal */}
      <ReceiptModal
        open={results.isOpen}
        report={results.report}
        onClose={() => results.setOpen(false)}
        onViewDetailed={(report: any) => {
          results.setOpen(false);
        }}
      />
    </>
  );
};

export default AnalysisModals;
