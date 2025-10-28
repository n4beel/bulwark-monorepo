"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";

const HeroHeader = () => {
  const rightVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const vid = rightVideoRef.current;
    if (vid) {
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.autoplay = true;

      // ✅ Ensures playback even if browser blocks initial autoplay
      vid.play().catch(() => {
        vid.addEventListener("canplay", () => vid.play(), { once: true });
      });
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-0 md:py-10">
      {/* Center Section: Image + Text */}
      <div className="text-center z-10 max-w-3xl mx-auto px-4">
        <Image
          src="/icons/hero-content.svg"
          alt="Instant Audit Estimates"
          width={700}
          height={300}
          className="w-full h-auto mx-auto"
          priority
        />

        <p className="mt-6 text-[20px] leading-[28px] tracking-[0px] font-normal text-text-secondary">
          Paste a repo or upload code, cost estimate, and
          <br />
          prioritized fixes — in minutes.
        </p>
      </div>

      {/* Right Circular Video */}
      <div className="absolute right-0 top-1/12 -translate-y-8 translate-x-3/4">
        <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full overflow-hidden">
          <video
            ref={rightVideoRef}
            className="w-full h-full object-cover rounded-full"
            muted
            playsInline
          >
            <source src="/videos/rounds.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
