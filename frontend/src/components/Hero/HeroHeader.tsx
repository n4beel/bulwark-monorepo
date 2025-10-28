"use client";
import Image from "next/image";

const HeroHeader = () => {
  return (
    <div className="relative flex flex-col items-center justify-center py-0 md:py-10">
      {/* Center Section: Image + Text */}
      <div className="text-center z-10 max-w-3xl mx-auto px-4">
        {/* Main Image */}
        <Image
          src="/icons/hero-content.svg"
          alt="Instant Audit Estimates"
          width={700}
          height={300}
          className="w-full h-auto mx-auto"
          priority
        />

        {/* Text below image */}
        <p className="mt-6 text-[20px] leading-[28px] tracking-[0px] font-normal text-text-secondary">
          Paste a repo or upload code, cost estimate, and
          <br />
          prioritized fixes — in minutes.
        </p>
      </div>

      {/* Right Section: Circular Video (Half Cut) */}
      <div className="absolute right-0 top-1/12 -translate-y-8 translate-x-3/4">
        <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full overflow-hidden ">
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
    </div>
  );
};

export default HeroHeader;
