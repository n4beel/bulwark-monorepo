'use client';

import RepoInputSection from '@/shared/components/RepoInputSection';
import { useEffect, useRef } from 'react';

interface HeroBodyProps {
  onConnectGitHub: () => void;
  onUploadZip: () => void;
  onAnalyze: (input: string) => void;
}

export default function HeroBody({
  onConnectGitHub,
  onUploadZip,
  onAnalyze,
}: HeroBodyProps) {
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    [leftVideoRef.current, rightVideoRef.current, bgVideoRef.current].forEach((vid) => {
      if (!vid) return;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.autoplay = true;
      vid.play().catch(() => {
        vid.addEventListener('canplay', () => vid.play(), { once: true });
      });
    });
  }, []);

  return (
    <div className="relative w-full mx-auto px-4 md:px-8 py-8 md:py-16">

      {/* LEFT CIRCLE VIDEO (Always visible & scaled correctly) */}
      <div className="absolute left-[-120px] md:left-[-160px] top-1/2 -translate-y-1/2 pointer-events-none select-none">
        <div className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] rounded-full overflow-hidden">
          <video ref={leftVideoRef} className="w-full h-full object-cover rounded-full">
            <source src="/videos/rounds.webm" type="video/webm" />
          </video>
        </div>
      </div>

    
      {/* BACKGROUND VIDEO CARD */}
  <div className="relative w-full max-w-[100%] 2xl:max-w-[90%] 4xl:max-w-[80%] 6xl:max-w-[70%] mx-auto">


        <video
          ref={bgVideoRef}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        >
          <source src="/videos/BulwarkSearchBg.webm" type="video/webm" />
        </video>

        <div className="relative w-full h-fit py-10 rounded-4xl overflow-hidden shadow-2xl flex items-center justify-center px-4">
          <div className="w-full max-w-[95%] md:max-w-[90%] 2xl:max-w-[70%] bg-[var(--overlay-bg)] backdrop-blur-lg border border-[var(--overlay-border)] rounded-2xl pb-4 md:p-10 shadow-xl">
            <RepoInputSection
              onConnectGitHub={onConnectGitHub}
              onUploadZip={onUploadZip}
              onAnalyze={onAnalyze}
              showStats
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
