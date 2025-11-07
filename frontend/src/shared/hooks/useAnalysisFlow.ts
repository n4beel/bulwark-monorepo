// hooks/useAnalysisFlows.ts
import { useUploadFlow } from '@/hooks';
import { toast } from 'sonner';
import { useState } from 'react';
import { GitHubFlowStep, useGitHubFlow } from '@/shared/hooks/useGitHubFlow';
import { fetchRepoFilesPublic } from '@/services/api';
import { handleGitHubLogin } from '@/utils/auth';

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

  // Entry point handlers
  const handleConnectGitHub = (
    redirectPath = '/',
    mode: 'auth' | 'connect' = 'auth',
  ) => {
    handleGitHubLogin(redirectPath, mode); // ✅ Pass mode parameter
  };

  const handleUploadZip = () => {
    setUploadFlowOpen(true);
  };

  const handleAnalyze = async (input: string) => {
    const match = input.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      toast.error(
        'Invalid repository URL. Use format: https://github.com/owner/repo',
      );
      return;
    }

    try {
      toast.success('Repository recognized — proceeding ✅');

      const owner = match[1];
      const repo = match[2];

      const result = await fetchRepoFilesPublic(owner, repo);
      const files = result.rsFilesOnly.map((item: any) => ({
        path: item.path,
        name: item.path.split('/').pop()!,
        size: 0,
        language: 'Rust',
      }));

      selectRepository(
        {
          id: 0,
          name: repo,
          full_name: `${owner}/${repo}`,
          html_url: input,
          private: false,
        },
        files,
      );

      setContractFiles(files);
      setStep(GitHubFlowStep.FILE_SELECT);
    } catch (error) {
      toast.error('Failed to analyze repository. Please try again.');
    }
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
      handleAuthSuccess,
      setStep,
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
      onConnectGitHub: handleConnectGitHub, // ✅ Now accepts mode parameter
      onUploadZip: handleUploadZip,
      onAnalyze: handleAnalyze,
    },
  };
};
