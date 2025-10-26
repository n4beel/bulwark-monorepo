"use client";

import { useEffect } from "react";

import GitHubModalHeader from "./GitHubModalHeader";
import { GitHubFlowStep } from "@/hooks/useGitHubFlow";
import RepositorySelector from "../RepositorySelector";
import UploadedContractFileSelector from "../UploadedContractFileSelector";
import StepAnalysisProgress from "../uploadFlow/StepAnalysisProgress";

interface Props {
  step: GitHubFlowStep;
  accessToken: string;
  onClose: () => void;
  selectedRepo: any;
  contractFiles: any[];
  selectRepository: (repo: any) => void;
  runAnalysis: (files: string[]) => void;
  apiReady: boolean;
  completeAnalysis: () => void;
  onOpenResults?: (report: any) => void;
  report: any;
}

export default function GitHubFlowModal({
  step,
  accessToken,
  onClose,
  selectedRepo,
  contractFiles,
  selectRepository,
  runAnalysis,
  apiReady,
  completeAnalysis,
  onOpenResults,
  report,
}: Props) {
  useEffect(() => {
    if (step === GitHubFlowStep.RESULTS && report) {
      onClose();
      onOpenResults?.(report);
    }
  }, [step, report, onClose, onOpenResults]);

  if (step === GitHubFlowStep.RESULTS) return null;

  // Don't show modal during AUTH step - that's handled separately
  if (step === GitHubFlowStep.AUTH) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-[720px] h-[680px]">
        <button
          onClick={onClose}
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
          <GitHubModalHeader
            step={
              step === GitHubFlowStep.REPO_SELECT
                ? "repoSelect"
                : step === GitHubFlowStep.FILE_SELECT
                ? "fileSelect"
                : "progress"
            }
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto">
            {step === GitHubFlowStep.REPO_SELECT && (
              <div className="px-10 py-6 min-h-[520px]">
                <RepositorySelector
                  accessToken={accessToken}
                  onSelect={selectRepository}
                  onBack={onClose}
                />
              </div>
            )}

            {step === GitHubFlowStep.FILE_SELECT && (
              <div className="px-10 py-6">
                <UploadedContractFileSelector
                  contractFiles={contractFiles}
                  onBack={onClose}
                  onProceed={(files) => runAnalysis(files)}
                />
              </div>
            )}

            {step === GitHubFlowStep.PROGRESS && (
              <StepAnalysisProgress
                onComplete={completeAnalysis}
                apiReady={apiReady}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
