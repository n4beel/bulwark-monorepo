"use client";
import { useState, useRef, useEffect } from "react";
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
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  const handleAnalyze = () => {
    if (repoInput.trim()) {
      onAnalyze(repoInput);
    }
  };

  // ✅ Ensures autoplay works across browsers (Chrome/Safari)
  useEffect(() => {
    [leftVideoRef.current, bgVideoRef.current].forEach((vid) => {
      if (vid) {
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.autoplay = true;

        vid.play().catch(() => {
          vid.addEventListener("canplay", () => vid.play(), { once: true });
        });
      }
    });
  }, []);

  return (
    <div className="relative w-full py-0 px-6 md:px-12 ">
      <div className="w-full mx-auto">
        <div className="relative flex items-center justify-center min-h-[450px]">
          {/* Left Side: Circular Video (Half Cut) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3/4 z-10">
            <div className="relative w-[200px] h-[200px] md:w-[250px] md:h-[250px] overflow-hidden">
              <video
                ref={leftVideoRef}
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
          <div className="relative w-full max-w-6xl z-0">
            {/* Background Video - Absolute positioned */}
            <video
              ref={bgVideoRef}
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
                <div className="w-[90%]  bg-[var(--overlay-bg)] backdrop-blur-md rounded-2xl p-8  shadow-xl border border-[var(--overlay-border)]">
                  <RepoInputSection
                    onConnectGitHub={onConnectGitHub}
                    onUploadZip={onUploadZip}
                    onAnalyze={onAnalyze}
                    showStats={true}
                    compact={true}
                  />
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
