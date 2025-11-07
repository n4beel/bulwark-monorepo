'use client';

import animationJson from '@/../public/lottie/Bulwark.json';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useEffect, useRef } from 'react';

export default function BulwarkAnimated() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting ? lottieRef.current?.play() : lottieRef.current?.stop()
        );
      },
      { threshold: 0.4 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

return (
  <div
    ref={containerRef}
    className="relative w-full flex items-center justify-center py-12 md:py-20"
  >
    {/* Responsive Full-Width Animation Wrapper */}
    <div className="relative w-full flex items-center justify-center">
      
      {/* Foreground Shield */}
      <div
        className="
          relative 
          w-[50vw] max-w-[260px]   /* ✅ on mobile: uses half screen, but caps size */
          sm:w-[45vw] sm:max-w-[300px]
          md:w-[300px] md:h-[300px]
          aspect-square flex items-center justify-center
        "
      >
        <video
          className="absolute inset-0 w-full h-full object-contain"
          muted
          playsInline
          autoPlay
          loop
        >
          <source src="/videos/BulwarkAnimation.webm" type="video/webm" />
        </video>

        {/* Glow Lottie */}
        <Lottie
          lottieRef={lottieRef}
          animationData={animationJson}
          loop={false}
          autoplay={false}
          className="absolute pointer-events-none opacity-90"
          style={{
            width: 'clamp(250px, 90vw, 1200px)',   // ✅ now scales full width on phones
            height: 'clamp(250px, 90vw, 1200px)',
          }}
        />
      </div>
    </div>
  </div>
);

}
