"use client";
import { useState } from "react";
import { Github, Upload } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import RepoInputSection from "../RepoInputSection";

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
                loop //
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
                  <RepoInputSection
                    onConnectGitHub={onConnectGitHub}
                    onUploadZip={onUploadZip}
                    onAnalyze={onAnalyze}
                    showStats={true}
                    compact={true}
                  />
                </div>
              </div>{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBody;
