"use client";
import { useEffect } from "react";
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

export default function UploadFlowModal(props: Props) {
  const {
    step,
    onClose,
    contractFiles,
    startFileSelect,
    runAnalysis,
    report,
    apiReady,
    goToPreviousStep,
    completeAnalysis,
  } = props;

  // lock background scroll (you said this is already fixed, keeping it here)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      {/* wrapper controls the button's absolute positioning relative to the modal */}
      <div className="relative w-full max-w-[720px] h-[680px]">
        {/* Close button OUTSIDE the modal box */}
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="absolute -top-2 -right-2 z-[10000]
                     w-6 h-6 bg-white border border-gray-300 shadow
                     rounded-full flex items-center justify-center
                     hover:bg-gray-200 transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Modal container */}
        <div
          className="relative w-full h-full bg-[var(--background)]
                        rounded-[24px] shadow-xl overflow-hidden flex flex-col"
        >
          <ModalHeader step={step} onClose={onClose} />

          <div className="flex-1 overflow-y-auto p-1 hide-scrollbar">
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
    </div>
  );
}
