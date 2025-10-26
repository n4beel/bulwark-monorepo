"use client";
import { useState } from "react";
import { Github, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface HeroBodyProps {
  onConnectGitHub: () => void;
  onUploadZip: () => void;
  onAnalyze: (input: string) => void;
}

const HeroBody = ({
  onConnectGitHub,
  onUploadZip,
  onAnalyze,
}: HeroBodyProps) => {
  const [repoInput, setRepoInput] = useState("");

  const handleAnalyze = () => {
    if (repoInput.trim()) {
      onAnalyze(repoInput);
    }
  };

  return (
    <div className="relative w-full py-0 px-6 md:px-12 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex items-center justify-center min-h-[450px]">
          {/* Left Side: Circular Video (Half Cut) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3/4 z-10">
            <div className="relative w-[200px] h-[200px] md:w-[250px] md:h-[250px] overflow-hidden">
              <video
                className="w-full h-full object-cover rounded-full"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/videos/rounds.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Center: Background Video with Transparent Overlay */}
          <div className="relative w-full max-w-4xl z-0">
            {/* Background Video - Absolute positioned */}
            <video
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/videos/BulwarkSearchBg.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>

            {/* Content Container - Same size as video */}
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              {/* Transparent Overlay Box */}
              <div className="absolute inset-0 flex items-center justify-center p-4 z-10 pb-20">
                <div className="w-full max-w-3xl bg-[var(--overlay-bg)] backdrop-blur-md rounded-2xl p-8 shadow-xl border border-[var(--overlay-border)]">
                  <div className="mb-6">
                    <Input
                      iconSvg="/icons/linkicon.svg"
                      iconPosition="left"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="Paste repo URL (GitHub/GitLab) or drop .sol/.rs/.zip"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAnalyze();
                        }
                      }}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Buttons in One Row: Connect GitHub & Upload Zip */}
                  {/* Buttons in One Row: All 3 buttons */}
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant="outline"
                      icon="/icons/GithubIcon.svg"
                      iconPosition="left"
                      onClick={onConnectGitHub}
                      className="flex-1"
                    >
                      Connect GitHub
                    </Button>

                    <Button
                      variant="outline"
                      icon="/icons/UploadIcon.svg"
                      iconPosition="left"
                      onClick={onUploadZip}
                      className="flex-1"
                    >
                      Upload zip
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleAnalyze}
                      disabled={!repoInput.trim()}
                      className="flex-1"
                    >
                      Analyze now
                    </Button>
                  </div>

                  {/* Remove the separate Analyze Now button below */}
                  {/* Additional Info */}
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
              </div>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--green-light)] rounded-full shadow-md border border-[var(--border-color)]">
                  <span className="inline-block w-2 h-2 bg-[var(--green-medium)] rounded-full"></span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    19,568 Repos Analyzed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBody;
