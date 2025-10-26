"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import GitHubAuth from "@/components/GitHubAuth";
import RepositorySelector from "@/components/RepositorySelector";
import ContractFileSelector from "@/components/ContractFileSelector";
import FolderUpload from "@/components/FolderUpload";
import UploadedContractFileSelector from "@/components/UploadedContractFileSelector";
import ReportDisplay from "@/components/ReportDisplay";
import StaticAnalysisReportDisplay from "@/components/StaticAnalysisReportDisplay";
import {
  GitHubRepository,
  PreAuditReport,
  StaticAnalysisReport,
} from "@/types/api";
import { scopingApi, staticAnalysisApi, uploadApi } from "@/services/api";
import Navbar from "@/components/NavBar";
import HeroSection from "@/components/Hero";
import { handleGitHubLogin } from "@/utils/auth";
import { useUploadFlow } from "@/hooks";
import UploadFlowModal from "@/components/uploadFlow/UploadFlowModal";
import ResultsModal from "@/components/Receipt/Receipt";
import ReceiptModal from "@/components/Receipt/Receipt";
import GitHubFlowModal from "@/components/UploadGihubFlow/GitHubModalFlow";
import { useGitHubFlow } from "@/hooks/useGitHubFlow";

interface ContractFile {
  path: string;
  name: string;
  size: number;
  language: string;
}

type AppState =
  | "auth"
  | "select"
  | "fileSelect"
  | "upload"
  | "uploadFileSelect"
  | "loading"
  | "report"
  | "staticReport";
type AnalysisType = "ai" | "static";

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export default function Home() {
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

  const [isUploadFlowOpen, setUploadFlowOpen] = useState(false);
  const [currentState, setCurrentState] = useState<AppState>("auth");
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [report, setReport] = useState<PreAuditReport | null>(null);
  const [staticReport, setStaticReport] = useState<StaticAnalysisReport | null>(
    null
  );
  const [currentAnalysisType, setCurrentAnalysisType] =
    useState<AnalysisType>("ai");
  const [error, setError] = useState("");
  const [extractedPath, setExtractedPath] = useState<string | null>(null);
  const [uploadedContractFiles, setUploadedContractFiles] = useState<
    ContractFile[]
  >([]);
  const [isGitHubFlowOpen, setGitHubFlowOpen] = useState(false); // NEW
  const [openResults, setOpenResults] = useState(false);
  const [resultsReport, setResultsReport] = useState<any>(null);
  const [pendingGitHubAuth, setPendingGitHubAuth] = useState(false); //
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
  } = useGitHubFlow();

  // Check for existing authentication on component mount
  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("github_token");
      const userData = localStorage.getItem("github_user");

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setAccessToken(token);
          setUser(user);
          setCurrentState("select");
        } catch {
          // Invalid user data, clear storage
          localStorage.removeItem("github_token");
          localStorage.removeItem("github_user");
        }
      }
    }
  }, []);

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

          // Open GitHub flow modal and set token
          handleAuthSuccess(token);
          setGitHubFlowOpen(true);

          // Clean URL
          window.history.replaceState({}, "", "/");
        } catch (err) {
          console.error("Error parsing OAuth response:", err);
        }
      } else {
        // Only check saved token if no OAuth callback
        const savedToken = localStorage.getItem("github_token");
        if (savedToken) {
          handleAuthSuccess(savedToken);
        }
      }
    }
  }, []);

  const handleRepoSelect = async (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setCurrentState("fileSelect");
  };

  const handleFileSelection = async (
    files: string[],
    analysisType: AnalysisType
  ) => {
    setSelectedFiles(files);
    setCurrentAnalysisType(analysisType);
    setCurrentState("loading");
    setError("");

    try {
      const [owner, repoName] = selectedRepo!.full_name.split("/");

      if (analysisType === "ai") {
        const reportData = await scopingApi.generateReport({
          owner,
          repo: repoName,
          accessToken: accessToken,
          selectedFiles: files,
        });

        setReport(reportData);
        setCurrentState("report");
      } else {
        const staticReportData = await staticAnalysisApi.analyzeRustContract({
          owner,
          repo: repoName,
          accessToken: accessToken,
          selectedFiles: files,
          analysisOptions: {
            includeTests: false,
            includeDependencies: true,
            depth: "deep",
          },
        });

        setStaticReport(staticReportData);
        setCurrentState("staticReport");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate report. Please try again.";
      setError(errorMessage);
      setCurrentState("fileSelect");
    }
  };

  const handleUploadSuccess = (
    extractedPath: string,
    contractFiles: ContractFile[]
  ) => {
    setExtractedPath(extractedPath);
    setUploadedContractFiles(contractFiles);
    setCurrentState("uploadFileSelect");
    setError("");
  };

  const handleUploadedFileSelection = async (
    files: string[],
    analysisType: AnalysisType
  ) => {
    if (!extractedPath) {
      setError("Extracted path not found. Please try uploading again.");
      return;
    }

    setSelectedFiles(files);
    setCurrentAnalysisType(analysisType);
    setCurrentState("loading");
    setError("");

    try {
      // For uploaded files, we only support static analysis for now
      // The new API endpoint is specifically for static analysis of uploaded contracts
      const result = await uploadApi.analyzeUploadedContracts(
        extractedPath,
        files
      );

      setStaticReport(result);
      setCurrentState("staticReport");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to analyze uploaded files. Please try again.";
      setError(errorMessage);
      setCurrentState("uploadFileSelect");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("github_token");
    localStorage.removeItem("github_user");
    setCurrentState("auth");
    setAccessToken("");
    setUser(null);
    setSelectedRepo(null);
    setReport(null);
    setStaticReport(null);
    setError("");
  };

  const handleBackToAuth = () => {
    setCurrentState("auth");
    setAccessToken("");
    setUser(null);
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setStaticReport(null);
    setError("");
  };

  const handleBackToSelect = () => {
    setCurrentState("select");
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setStaticReport(null);
    setError("");
  };

  const handleNewAnalysis = () => {
    if (user) {
      setCurrentState("select");
    } else {
      setCurrentState("auth");
    }
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setStaticReport(null);
    setError("");
  };

  const handleBackToUpload = () => {
    setCurrentState("upload");
    setSelectedRepo(null);
    setSelectedFiles([]);
    setReport(null);
    setStaticReport(null);
    setExtractedPath(null);
    setUploadedContractFiles([]);
    setError("");
  };

  const handleBackToUploadFileSelect = () => {
    setCurrentState("uploadFileSelect");
    setSelectedFiles([]);
    setReport(null);
    setStaticReport(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section - Full Width */}
      {/* {currentState === "auth" && <HeroSection onAnalyze={()=>{}} onConnectGitHub={on} />} */}
      <HeroSection
        onConnectGitHub={handleGitHubLogin}
        onUploadZip={() => setUploadFlowOpen(true)}
        onAnalyze={(input) => {
          console.log("Analyze input:", input);
        }}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentState === "auth" && (
          <div>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GitHub Auth */}
                <div>
                  <GitHubAuth />
                </div>

                {/* Upload Option */}
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-center mb-6">
                      <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Upload Folder
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Upload a zipped folder containing your smart contracts
                        directly
                      </p>
                    </div>

                    <button
                      onClick={() => setCurrentState("upload")}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Analyze
                    </button>

                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500">
                        Supports .zip, .tar.gz, .7z, .rar files up to 100MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentState === "select" && (
          <RepositorySelector
            accessToken={accessToken}
            onSelect={handleRepoSelect}
            onBack={handleBackToAuth}
          />
        )}

        {currentState === "upload" && (
          <FolderUpload
            onUploadSuccess={handleUploadSuccess}
            onBack={() => setCurrentState(user ? "select" : "auth")}
          />
        )}

        {currentState === "fileSelect" && selectedRepo && (
          <ContractFileSelector
            repository={selectedRepo}
            accessToken={accessToken}
            onBack={handleBackToSelect}
            onProceed={handleFileSelection}
          />
        )}

        {currentState === "uploadFileSelect" && extractedPath && (
          <UploadedContractFileSelector
            contractFiles={uploadedContractFiles}
            onBack={handleBackToUpload}
            onProceed={handleUploadedFileSelection}
          />
        )}

        {currentState === "loading" && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentAnalysisType === "ai"
                  ? "Running AI Analysis"
                  : "Running Static Analysis"}
              </h3>
              <p className="text-gray-600">
                {selectedRepo
                  ? `${selectedRepo.full_name}`
                  : "Uploaded contracts"}{" "}
                • {selectedFiles.length} files selected • This may take a few
                moments...
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">
                    {selectedRepo
                      ? "Cloning repository"
                      : "Processing uploaded files"}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">
                    {currentAnalysisType === "ai"
                      ? "Analyzing selected contract files"
                      : "Performing static code analysis"}
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">
                    {currentAnalysisType === "ai"
                      ? "Generating audit estimates"
                      : "Calculating complexity metrics"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentState === "report" && report && (
          <ReportDisplay
            report={report}
            onBack={
              selectedRepo ? handleBackToSelect : handleBackToUploadFileSelect
            }
            onNewAnalysis={handleNewAnalysis}
          />
        )}

        {currentState === "staticReport" && staticReport && (
          <StaticAnalysisReportDisplay
            report={staticReport}
            onBack={
              selectedRepo ? handleBackToSelect : handleBackToUploadFileSelect
            }
            onNewAnalysis={handleNewAnalysis}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>MySecurity Tool • Smart Contract Security Analysis Platform</p>
            <p className="mt-1">
              Powered by advanced static analysis and AI-driven insights
            </p>
          </div>
        </div>
      </footer>
      {isUploadFlowOpen && (
        <UploadFlowModal
          step={step}
          contractFiles={contractFiles}
          startFileSelect={startFileSelect}
          runAnalysis={runAnalysis}
          report={finalReport}
          apiReady={!isAnalyzing}
          goToPreviousStep={goToPreviousStep}
          completeAnalysis={completeAnalysis}
          onClose={() => {
            resetFlow();
            setUploadFlowOpen(false);
          }}
          onOpenResults={(r) => {
            setResultsReport(r);
            setOpenResults(true);
          }}
        />
      )}
      <GitHubFlowModal
        step={githubStep}
        accessToken={githubAccessToken}
        onClose={() => {
          setGitHubFlowOpen(false);
          resetGithubFlow();
        }}
        selectedRepo={githubSelectedRepo}
        contractFiles={githubFiles}
        selectRepository={selectRepository}
        runAnalysis={runGithubAnalysis}
        apiReady={!isGithubAnalyzing}
        completeAnalysis={completeGithubAnalysis}
        onOpenResults={(report) => {
          setResultsReport(report);
          setOpenResults(true);
        }}
        report={githubReport}
      />
      <ReceiptModal
        open={openResults}
        report={resultsReport}
        onClose={() => setOpenResults(false)}
      />
    </div>
  );
}
