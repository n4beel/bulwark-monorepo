"use client";
import StepUpload from "./StepUpload";
import StepFileSelect from "./StepFileSelect";
import StepAnalysisProgress from "./StepAnalysisProgress";
import StepResults from "./StepResults";
import { UploadFlowStep } from "@/hooks/useUploadFlow";
import ModalHeader from "./ModalHeader";

interface Props {
  step: UploadFlowStep;
  onClose: () => void;
  contractFiles: any[];
  startFileSelect: (exPath: string, files: any[]) => void;
  runAnalysis: (files: string[]) => void;
  report: any;
  apiReady: boolean;
  goToPreviousStep: (step: UploadFlowStep) => void;
  completeAnalysis: () => void;
}

export default function UploadFlowModal({
  step,
  onClose,
  contractFiles,
  startFileSelect,
  runAnalysis,
  report,
  apiReady,
  goToPreviousStep,
  completeAnalysis,
}: Props) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-[720px] h-[680px] rounded-[26px] bg-[var(--background)] shadow-xl overflow-hidden flex flex-col">
        <ModalHeader step={step} onClose={onClose} />

        <div className="flex-1 overflow-y-auto">
          {step === UploadFlowStep.UPLOAD && (
            <StepUpload onComplete={startFileSelect} onBack={onClose} />
          )}

          {step === UploadFlowStep.FILE_SELECT && (
            <StepFileSelect
              contractFiles={contractFiles}
              onExecute={runAnalysis}
              onBack={() => goToPreviousStep(step)}
            />
          )}

          {step === UploadFlowStep.PROGRESS && (
            <StepAnalysisProgress
              onComplete={completeAnalysis}
              apiReady={apiReady}
            />
          )}

          {step === UploadFlowStep.RESULTS && (
            <StepResults report={report} onExit={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
