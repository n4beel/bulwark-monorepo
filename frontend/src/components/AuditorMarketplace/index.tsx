"use client";
import Image from "next/image";

export default function AuditorMarketplace() {
  return (
    <section className="w-full py-20 px-6">
      <div className="max-w-7xl mx-auto bg-[#EDF3FF] rounded-3xl p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col gap-4 max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs bg-[#EDF3FF] text-[var(--blue-primary)] px-1 py-1 rounded-full border border-[var(--blue-light)] w-[120px]">
            <Image
              src="/icons/Gemini.svg" // ✅ You will replace actual icon path
              alt="Coming soon"
              width={14}
              height={14}
            />
            Coming Soon
          </div>

          {/* Title */}
          <h2
            className="text-4xl doto tracking-widest"
            style={{ color: "var(--black)" }}
          >
            Auditor Marketplace
          </h2>

          {/* Description */}
          <p className="leading-relaxed text-[var(--text-secondary)]">
            Get matched with top auditors based on stack, size, and risk
            profile. Skip the cold outreach and connect directly with pre-vetted
            security experts.
          </p>

          {/* Bullet list */}
          <ul className="space-y-2 text-[var(--text-secondary)] text-sm">
            <li className="flex gap-2">
              <span className="text-[var(--blue-primary)] font-bold">•</span>
              Smart matching based on expertise
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--blue-primary)] font-bold">•</span>
              Transparent pricing and timelines
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--blue-primary)] font-bold">•</span>
              Verified track records and reviews
            </li>
          </ul>

          {/* CTA Button */}
          <button
            className="mt-4 w-fit inline-flex items-center gap-2 px-6 py-3 rounded-lg 
            text-white bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] transition cursor-pointer"
          >
            Join the waitlist →
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-full max-w-[460px]">
          <Image
            src="/icons/AuditorPreview.svg"
            alt="Auditor Marketplace Preview"
            width={460}
            height={340}
            className="rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
