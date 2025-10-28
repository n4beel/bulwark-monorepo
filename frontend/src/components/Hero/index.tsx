"use client";

import HeroBody from "./HeroBody";
import HeroFooter from "./HeroFooter";
import HeroHeader from "./HeroHeader";

interface HeroSectionProps {
  onConnectGitHub: () => void;
  onUploadZip: () => void;
  onAnalyze: (input: string) => void;
}

const HeroSection = ({
  onConnectGitHub,
  onUploadZip,
  onAnalyze,
}: HeroSectionProps) => {
  return (
    <section
      className="hero-container bg-[var(--background)] overflow-hidden "
      id="analyze"
    >
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-0">
        <HeroHeader />
      </div>

      {/* Hero Body */}
      <HeroBody
        onConnectGitHub={onConnectGitHub}
        onUploadZip={onUploadZip}
        onAnalyze={onAnalyze}
      />
      <HeroFooter />
    </section>
  );
};

export default HeroSection;
