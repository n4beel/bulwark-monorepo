'use client';

import HeroBody from './HeroBody';
import HeroFooter from './HeroFooter';
import HeroHeader from './HeroHeader';

interface HeroSectionProps {
  onConnectGitHub: () => void;
  onUploadZip: () => void;
  onAnalyze: (input: string) => void;
}

export default function HeroSection({
  onConnectGitHub,
  onUploadZip,
  onAnalyze,
}: HeroSectionProps) {
  return (
    <section id="analyze" className="w-full overflow-hidden pt-24">
      <div className="mx-auto w-full px-4 md:px-6">
        <HeroHeader />
        <HeroBody
          onConnectGitHub={onConnectGitHub}
          onUploadZip={onUploadZip}
          onAnalyze={onAnalyze}
        />
        <HeroFooter />
      </div>
    </section>
  );
}
