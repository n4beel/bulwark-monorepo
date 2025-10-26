"use client";

import { useState } from "react";
import { githubApi, scopingApi, staticAnalysisApi } from "@/services/api";
import { GitHubRepositoryContent } from "@/types/api";

export enum GitHubFlowStep {
  AUTH = "auth",
  REPO_SELECT = "repoSelect",
  FILE_SELECT = "fileSelect",
  PROGRESS = "progress",
  RESULTS = "results",
}

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

export function useGitHubFlow() {
  const [step, setStep] = useState<GitHubFlowStep>(GitHubFlowStep.AUTH);
  const [accessToken, setAccessToken] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [contractFiles, setContractFiles] = useState<ContractFile[]>([]);
  const [report, setReport] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    setStep(GitHubFlowStep.REPO_SELECT);
  };

  // Recursively find all .rs files in repository
  const findRustFiles = async (
    owner: string,
    repo: string,
    token: string,
    path: string = ""
  ): Promise<ContractFile[]> => {
    const contents = await githubApi.getRepositoryContents(
      owner,
      repo,
      token,
      path
    );

    let files: ContractFile[] = [];

    for (const item of contents) {
      if (item.type === "file" && item.name.endsWith(".rs")) {
        files.push({
          path: item.path,
          name: item.name,
          size: item.size || 0,
          language: "Rust (Solana/Near)",
        });
      } else if (item.type === "dir") {
        // Recursively search subdirectories
        const subFiles = await findRustFiles(owner, repo, token, item.path);
        files = files.concat(subFiles);
      }
    }

    return files;
  };

  const selectRepository = async (repo: any) => {
    setSelectedRepo(repo);

    try {
      // Extract owner/repo from full_name
      const [owner, repoName] = repo.full_name.split("/");

      // Find all .rs contract files in the repository
      const rustFiles = await findRustFiles(owner, repoName, accessToken);

      setContractFiles(rustFiles);
      setStep(GitHubFlowStep.FILE_SELECT);
    } catch (err) {
      console.error("Error detecting contract files:", err);
      alert("Failed to detect contract files in repository");
    }
  };
  const runAnalysis = async (selectedFiles: string[]) => {
    if (!selectedRepo) return;

    setStep(GitHubFlowStep.PROGRESS);
    setIsAnalyzing(true);

    try {
      const [owner, repoName] = selectedRepo.full_name.split("/");

      // Call scoping API
      const scopingReport = await scopingApi.generateReport({
        owner,
        repo: repoName,
        accessToken: accessToken,
        selectedFiles: selectedFiles,
      });

      // Call static analysis API
      const staticReport = await staticAnalysisApi.analyzeRustContract({
        owner,
        repo: repoName,
        accessToken: accessToken,
        selectedFiles: selectedFiles,
        analysisOptions: {
          includeTests: false,
          includeDependencies: true,
          depth: "deep",
        },
      });

      // Map to unified ReceiptReport format
      const unifiedReport = {
        _id: staticReport._id || `GH-${Date.now()}`,

        // Source info
        repository: selectedRepo.full_name,
        createdAt: scopingReport.generatedAt || new Date().toISOString(),
        language: scopingReport.repositoryInfo?.language || "Rust",
        framework: staticReport?.framework || "Solana",

        // Scores from static analysis
        scores: {
          structural: { score: staticReport.scores?.structural?.score || 0 },
          security: { score: staticReport.scores?.security?.score || 0 },
          systemic: { score: staticReport.scores?.systemic?.score || 0 },
          economic: { score: staticReport.scores?.economic?.score || 0 },
        },

        // Summary/findings
        summary: {
          severityCounts: {
            high: 0,
            medium: 0,
            low: 0,
          },
          totalFindings: 0,
        },

        // Scan metadata
        scanMetadata: {
          totalFiles: contractFiles.length,
          scannedFiles: selectedFiles.length,
          sizeKB: Math.round((scopingReport.repositoryInfo?.size || 0) / 1024),
        },

        // Audit estimate from scoping
        estimate: {
          days: [
            scopingReport.auditEstimate?.duration?.min || 12,
            scopingReport.auditEstimate?.duration?.max || 19,
          ],
          devs: [
            scopingReport.auditEstimate?.resources?.juniorAuditors || 1,
            scopingReport.auditEstimate?.resources?.seniorAuditors || 2,
          ],
          cost: scopingReport.auditEstimate?.cost?.min || 18000,
          variance: 20, // Calculate: ((max - min) / min) * 100
        },

        receiptId: `GH-${Date.now().toString().slice(-6)}`,
        commitHash: "missing",

        // Extra metadata for detailed view
        riskFactors: scopingReport.auditEstimate?.riskFactors || [],
        specialConsiderations:
          scopingReport.auditEstimate?.specialConsiderations || [],
      };

      setReport(unifiedReport);
      setIsAnalyzing(false);
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Analysis failed. Please try again.");
      setIsAnalyzing(false);
      setStep(GitHubFlowStep.FILE_SELECT);
    }
  };

  const completeAnalysis = () => {
    setStep(GitHubFlowStep.RESULTS);
    if (typeof window !== "undefined") {
      localStorage.removeItem("github_token");
      localStorage.removeItem("github_user");
    }

    setAccessToken("");
  };

  const resetFlow = () => {
    setStep(GitHubFlowStep.AUTH);
    setAccessToken("");
    setSelectedRepo(null);
    setContractFiles([]);
    setReport(null);
    setIsAnalyzing(false);
  };

  return {
    step,
    accessToken,
    selectedRepo,
    contractFiles,
    report,
    isAnalyzing,
    handleAuthSuccess,
    selectRepository,
    runAnalysis,
    completeAnalysis,
    resetFlow,
  };
}
