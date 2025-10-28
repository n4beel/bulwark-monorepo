// components/shared/RepoInputSection.tsx
"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface RepoInputSectionProps {
  onConnectGitHub: () => void;
  onUploadZip: () => void;
  onAnalyze: (input: string) => Promise<void> | void;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

const RepoInputSection = ({
  onConnectGitHub,
  onUploadZip,
  onAnalyze,
  showStats = true,
  compact = false,
  className = "",
}: RepoInputSectionProps) => {
  const [repoInput, setRepoInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    const githubRegex =
      /^https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)(\/.*)?$/;

    if (githubRegex.test(repoInput.trim())) {
      try {
        setIsAnalyzing(true);
        await onAnalyze(repoInput.trim());
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAnalyzing) {
      handleAnalyze();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full bg-[var(--overlay-bg)] backdrop-blur-md rounded-2xl shadow-xl border border-[var(--overlay-border)] ${
          compact ? "p-6" : "p-8"
        }`}
      >
        {/* Input Field */}
        <div className="mb-6">
          <Input
            iconSvg="/icons/linkicon.svg"
            iconPosition="left"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Paste repo URL (GitHub/GitLab) or drop .sol/.rs/.zip"
            onKeyPress={handleKeyPress}
            className="rounded-xl"
            disabled={isAnalyzing}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-4">
          <Button
            variant="outline"
            icon="/icons/GithubIcon.svg"
            iconPosition="left"
            onClick={onConnectGitHub}
            className="flex-1"
            disabled={isAnalyzing}
          >
            Connect GitHub
          </Button>

          <Button
            variant="outline"
            icon="/icons/UploadIcon.svg"
            iconPosition="left"
            onClick={onUploadZip}
            className="flex-1"
            disabled={isAnalyzing}
          >
            Upload zip
          </Button>

          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={!repoInput.trim() || isAnalyzing}
            className="flex-1 relative"
          >
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </div>
            ) : (
              "Analyze now"
            )}
          </Button>
        </div>

        {/* Info Text */}
        <p className="text-center text-[var(--text-secondary)] text-sm mt-4">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--green-medium)] rounded-full"></span>
            Only available for rust (solana) codebases
          </span>
          {" • "}
          Private repos via OAuth
          {" • "}
          Max 100MB
        </p>
      </div>

      {/* Stats Badge (Optional) */}
      {showStats && (
        <div className="mt-5 flex justify-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--green-light)] rounded-full shadow-md border border-[var(--border-color)]">
            <span className="inline-block w-2 h-2 bg-[var(--green-medium)] rounded-full"></span>
            <span className="text-[var(--text-primary)] font-semibold">
              19,568 Repos Analyzed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoInputSection;
