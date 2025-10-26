// hooks/useAnalysisFlows.ts (SIMPLE & CLEAN)
/**
 * Simple hook that manages ALL analysis flows
 * No duplicate state needed in components
 */

import { useState, useEffect } from "react";
import { useUploadFlow } from "@/hooks";
import { GitHubFlowStep, useGitHubFlow } from "@/hooks/useGitHubFlow";
import { handleGitHubLogin } from "@/utils/auth";
import { fetchRepoFilesPublic } from "@/services/api";

export const useAnalysisFlows = () => {
  // Upload Flow Hook
  const {
    step,
    contractFiles,
    report: finalReport,
    isAnalyzing,
    startFileSelect,
    runAnalysis,
    resetFlow,
    goToPreviousStep,
    completeAnalysis,
  } = useUploadFlow();

  // GitHub Flow Hook
  const {
    step: githubStep,
    accessToken: githubAccessToken,
    selectedRepo: githubSelectedRepo,
    contractFiles: githubFiles,
    report: githubReport,
    isAnalyzing: isGithubAnalyzing,
    handleAuthSuccess,
    selectRepository,
    runAnalysis: runGithubAnalysis,
    completeAnalysis: completeGithubAnalysis,
    resetFlow: resetGithubFlow,
    setStep,
    setContractFiles,
  } = useGitHubFlow();

  // Modal States
  const [isUploadFlowOpen, setUploadFlowOpen] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const [resultsReport, setResultsReport] = useState<any>(null);

  // OAuth Callback Handler
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitialized) {
      setHasInitialized(true);

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      const userStr = urlParams.get("user");

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem("github_token", token);
          localStorage.setItem("github_user", JSON.stringify(user));

          // Open GitHub flow modal
          handleAuthSuccess(token);

          // Clean URL
          const currentPath = window.location.pathname;
          window.history.replaceState({}, "", currentPath);
        } catch (err) {
          console.error("Error parsing OAuth response:", err);
        }
      }
    }
  }, [hasInitialized, handleAuthSuccess]);

  // Entry point handlers
  const handleConnectGitHub = () => {
    handleGitHubLogin();
  };

  const handleUploadZip = () => {
    setUploadFlowOpen(true);
  };

  const handleAnalyze = async (input: string) => {
    const match = input.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid GitHub URL format");

    const owner = match[1];
    const repo = match[2];

    const result = await fetchRepoFilesPublic(owner, repo);
    const files = result.rsFilesOnly.map((item: any) => ({
      path: item.path,
      name: item.path.split("/").pop()!,
      size: 0,
      language: "Rust",
    }));
    // ✅ Set GitHubFlow Repo
    selectRepository(
      {
        id: 0,
        name: repo,
        full_name: `${owner}/${repo}`,
        html_url: input,
        private: false,
      },
      files
    ); // IMPORTANT ✅

    // ✅ Set files into GitHubFlow
    setContractFiles(files);

    // ✅ Open modal file selection UI
    setStep(GitHubFlowStep.FILE_SELECT);
  };

  return {
    // Upload Flow
    uploadFlow: {
      isOpen: isUploadFlowOpen,
      setOpen: setUploadFlowOpen,
      step,
      contractFiles,
      report: finalReport,
      isAnalyzing,
      startFileSelect,
      runAnalysis,
      resetFlow,
      goToPreviousStep,
      completeAnalysis,
    },

    // GitHub Flow
    githubFlow: {
      step: githubStep,
      accessToken: githubAccessToken,
      selectedRepo: githubSelectedRepo,
      contractFiles: githubFiles,
      report: githubReport,
      isAnalyzing: isGithubAnalyzing,
      selectRepository,
      runAnalysis: runGithubAnalysis,
      completeAnalysis: completeGithubAnalysis,
      resetFlow: resetGithubFlow,
    },

    // Results Modal
    results: {
      isOpen: openResults,
      setOpen: setOpenResults,
      report: resultsReport,
      setReport: setResultsReport,
    },

    // Entry point handlers
    handlers: {
      onConnectGitHub: handleConnectGitHub,
      onUploadZip: handleUploadZip,
      onAnalyze: handleAnalyze,
    },
  };
};
