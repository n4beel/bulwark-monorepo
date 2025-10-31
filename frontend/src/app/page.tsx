"use client";

import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";

import { fetchRepoFilesPublic } from "@/services/api";
import Navbar from "@/components/NavBar";
import HeroSection from "@/components/Hero";
import { handleGitHubLogin } from "@/utils/auth";
import { useUploadFlow } from "@/hooks";
import UploadFlowModal from "@/components/uploadFlow/UploadFlowModal";
import ResultsModal from "@/components/Receipt/Receipt";
import ReceiptModal from "@/components/Receipt/Receipt";
import GitHubFlowModal from "@/components/UploadGihubFlow/GitHubModalFlow";
import { GitHubFlowStep, useGitHubFlow } from "@/hooks/useGitHubFlow";
import BulwarkAnimated from "@/components/BulwarkAnimated";
import FeatureCards from "@/components/FeatureCards";
import { features, teamItems } from "@/constants/ui";
import HowItWorks from "@/components/HowItWorks";
import Web3TeamsSection from "@/components/Web3TeamSection";
import AuditorMarketplace from "@/components/AuditorMarketplace";
import PricingSection from "@/components/Pricing";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsLetter";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useAppSelector } from "@/hooks/useAppSelector";

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
  const { githubToken } = useAppSelector((state: RootState) => state.auth);

  const [error, setError] = useState("");

  const [openResults, setOpenResults] = useState(false);
  const [resultsReport, setResultsReport] = useState<any>(null);

  const {
    step: githubStep,
    accessToken: githubAccessToken,
    selectedRepo: githubSelectedRepo,
    contractFiles: githubFiles,
    setContractFiles,
    report: githubReport,
    isAnalyzing: isGithubAnalyzing,
    handleAuthSuccess,
    selectRepository,
    runAnalysis: runGithubAnalysis,
    completeAnalysis: completeGithubAnalysis,
    resetFlow: resetGithubFlow,
    setStep,
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

  useEffect(() => {
    const shouldOpenFlow = sessionStorage.getItem("open_github_flow");

    if (shouldOpenFlow === "true") {
      sessionStorage.removeItem("open_github_flow");

      if (githubToken) {
        handleAuthSuccess(githubToken);
        setStep(GitHubFlowStep.REPO_SELECT);
      }
    }
  }, [handleAuthSuccess, setStep]);
  return (
    <div className="min-h-screen bg-gray-50  ">
      <Navbar />

      <HeroSection
        onConnectGitHub={() => handleGitHubLogin("/", "connect")}
        onUploadZip={() => setUploadFlowOpen(true)}
        onAnalyze={async (input) => {
          try {
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
          } catch (err) {
            setError("❌ Repo not found or not a public repo with Rust files.");
          }
        }}
      />
      <div className="flex justify-center items-center w-full h-[150px]">
        <Image
          src="/icons/BulwarkHeading.svg"
          alt="Bulwark Background"
          width={800} // adjust size as needed
          height={200}
        />
      </div>

      <BulwarkAnimated />
      <FeatureCards items={features} />
      <HowItWorks />
      <Web3TeamsSection
        title="Built for Modern Web3 Teams"
        subtitle="Serving all streams of contributors across Solana"
        items={teamItems}
      />
      <AuditorMarketplace />
      <PricingSection />
      <NewsletterSection />
      <Footer />

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
          resetGithubFlow();
          localStorage.removeItem("github_token");
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
