// components/BulwarkAnimated.tsx
"use client";

export default function BulwarkAnimated() {
  return (
    <div className="flex items-center justify-center gap-6 py-10 mt-20">
      {/* Left Image */}
      <img
        src="/icons/Bulwark.svg"
        alt="Left"
        className="w-24 h-24 object-contain"
      />

      {/* Center Video */}
      <video
        className="w-150 h-100 object-contain"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/videos/BulwarkAnimation.webm" type="video/webm" />
      </video>

      {/* Right Image */}
      <img
        src="/icons/Bulwark.svg"
        alt="Right"
        className="w-35 h-24 object-contain"
      />
    </div>
  );
}
