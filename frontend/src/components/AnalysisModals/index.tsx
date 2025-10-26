// components/shared/AnalysisModals.tsx (SIMPLE VERSION)
"use client";
import UploadFlowModal from "@/components/uploadFlow/UploadFlowModal";
import GitHubFlowModal from "@/components/UploadGihubFlow/GitHubModalFlow";
import ReceiptModal from "@/components/Receipt/Receipt";

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
          if (typeof window !== "undefined") {
            localStorage.removeItem("github_token");
          }
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
      />
    </>
  );
};

export default AnalysisModals;
