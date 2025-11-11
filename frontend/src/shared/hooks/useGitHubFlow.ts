'use client';

import { useState } from 'react';
import { githubApi, staticAnalysisApi } from '@/services/api';

export enum GitHubFlowStep {
  AUTH = 'auth',
  REPO_SELECT = 'repoSelect',
  FILE_SELECT = 'fileSelect',
  PROGRESS = 'progress',
  RESULTS = 'results',
}

export interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

export function useGitHubFlow() {
  const [step, setStep] = useState<GitHubFlowStep>(GitHubFlowStep.AUTH);
  const [accessToken, setAccessToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [contractFiles, setContractFiles] = useState<ContractFile[]>([]);
  const [report, setReport] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpen, setOpen] = useState(false);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    setStep(GitHubFlowStep.REPO_SELECT);
    setOpen(true);
  };

  // Recursively find all .rs files in repository
  const findRustFiles = async (
    owner: string,
    repo: string,
    token: string,
    path: string = '',
  ): Promise<ContractFile[]> => {
    const contents = await githubApi.getRepositoryContents(
      owner,
      repo,
      token,
      path,
    );

    let files: ContractFile[] = [];

    for (const item of contents) {
      if (item.type === 'file' && item.name.endsWith('.rs')) {
        files.push({
          path: item.path,
          name: item.name,
          size: item.size || 0,
          language: 'Rust (Solana/Near)',
        });
      } else if (item.type === 'dir') {
        // Recursively search subdirectories
        const subFiles = await findRustFiles(owner, repo, token, item.path);
        files = files.concat(subFiles);
      }
    }

    return files;
  };
  const selectRepository = async (repo: any, localFiles?: ContractFile[]) => {
    setSelectedRepo(repo);

    try {
      // ✅ If files already set (from URL paste flow)
      if (localFiles && localFiles?.length > 0) {
        setStep(GitHubFlowStep.FILE_SELECT);
        return;
      }

      // ✅ Normal GitHub flow
      const [owner, repoName] = repo.full_name.split('/');

      const rustFiles = await findRustFiles(owner, repoName, accessToken);

      if (!rustFiles || rustFiles.length === 0) {
        alert('No Rust (.rs) files found in this repo.');
        return;
      }

      setContractFiles(rustFiles);
      setStep(GitHubFlowStep.FILE_SELECT);
    } catch (err) {
      console.error('Error detecting contract files:', err);
      alert('Failed to detect contract files in repository');
    }
  };

  const runAnalysis = async (selectedFiles: string[]) => {
    if (!selectedFiles) return;

    setStep(GitHubFlowStep.PROGRESS);
    setIsAnalyzing(true);

    try {
      const [owner, repoName] = selectedRepo.full_name.split('/');

      // Call scoping API
      // const scopingReport = await scopingApi.generateReport({
      //   owner,
      //   repo: repoName,
      //   accessToken: accessToken,
      //   selectedFiles: selectedFiles,
      // });

      // Call static analysis API
      const staticReport = await staticAnalysisApi.analyzeRustContract({
        owner,
        repo: repoName,
        accessToken: accessToken,
        selectedFiles: selectedFiles,
        analysisOptions: {
          includeTests: false,
          includeDependencies: true,
          depth: 'deep',
        },
      });

      setReport(staticReport);
      setIsAnalyzing(false);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('Analysis failed. Please try again.');
      setIsAnalyzing(false);
      setStep(GitHubFlowStep.FILE_SELECT);
    }
  };

  const completeAnalysis = () => {
    setStep(GitHubFlowStep.RESULTS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_token');
      localStorage.removeItem('github_user');
    }
    localStorage.removeItem('github_token');
    setOpen(false);
    setAccessToken('');
  };

  const resetFlow = () => {
    setStep(GitHubFlowStep.AUTH);
    setAccessToken('');
    // setSelectedRepo(null);
    setContractFiles([]);
    setReport(null);
    setOpen(false);
    setIsAnalyzing(false);
  };

  return {
    step,
    accessToken,
    selectedRepo,
    setSelectedRepo,
    contractFiles,
    report,
    isAnalyzing,
    setStep,
    setContractFiles,
    handleAuthSuccess,
    selectRepository,
    runAnalysis,
    completeAnalysis,
    resetFlow,
    isOpen,
    setOpen,
  };
}
