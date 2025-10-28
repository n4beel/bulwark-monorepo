"use client";
import { useEffect } from "react";
import StepUpload from "./StepUpload";
import StepFileSelect from "./StepFileSelect";
import StepAnalysisProgress from "./StepAnalysisProgress";
import StepResults from "../Receipt/StepResults";
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
// UploadFlowModal.tsx (drop-in replacement core)
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
  onOpenResults, // 👈 NEW
}: Props & { onOpenResults?: (report: any) => void }) {
  // stop scroll

  if (step === UploadFlowStep.RESULTS) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-[720px] h-[680px]">
        {/* close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="absolute -top-2 -right-2 z-[10000] w-6 h-6 bg-white border border-gray-300 shadow cursor-pointer rounded-full flex items-center justify-center hover:bg-gray-200 transition"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="relative w-full h-full bg-[var(--background)] rounded-[24px] shadow-xl overflow-hidden flex flex-col">
          <ModalHeader step={step} onClose={onClose} />
          <div className="flex-1 p-1">
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
                onComplete={() => {
                  onClose(); // close Upload Modal
                  onOpenResults?.(report); // open Results Modal
                }}
                apiReady={apiReady}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
