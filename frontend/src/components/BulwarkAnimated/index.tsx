"use client";

import { useRef, useEffect } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import animationJson from "@/../public/lottie/Bulwark.json";
import Image from "next/image";

export default function BulwarkAnimated() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // ✅ Start animation once when visible
            lottieRef.current?.play();
          } else {
            // ✅ Stop when user scrolls away
            lottieRef.current?.stop();
          }
        });
      },
      { threshold: 0.4 } // 40% visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="relative mx-auto flex items-center justify-center my-30"
      >
        {/* Small WebM foreground */}
        <div className="relative w-[270px] h-[270px] flex items-center justify-center">
          <video
            className="absolute inset-0 w-full h-full object-contain"
            autoPlay={false}
            loop={false}
            muted
            playsInline
          >
            <source src="/videos/BulwarkAnimation.webm" type="video/webm" />
          </video>

          {/* Giant Lottie overlay (plays on scroll) */}
          <Lottie
            lottieRef={lottieRef}
            animationData={animationJson}
            loop={false}
            autoplay={false}
            className="absolute pointer-events-none"
            style={{
              width: "1100px",
              height: "1100px",
              top: "50%",
              left: "70%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    </>
  );
}
