'use client';

import Image from 'next/image';
import ComingSoonChip from '../../../../shared/components/ComingSoonChip';

export default function AuditorMarketplace() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24" id="marketplace">
      <div
        className="
          bg-[#EDF3FF] rounded-3xl border border-[var(--card-accent)]
          shadow-[0_10px_40px_rgba(0,0,0,0.06)]
          px-8 py-12 md:px-12 md:py-14
          flex flex-col md:flex-row items-center justify-between gap-10
        "
      >
        {/* LEFT COPY BLOCK */}
        <div className="flex flex-col gap-5 max-w-md md:max-w-lg text-left">

          <ComingSoonChip />

          <h2
            className="text-2xl md:text-4xl font-normal leading-snug"
            style={{ fontFamily: '"Doto", sans-serif', color: 'var(--black-primary)' }}
          >
            Auditor Marketplace
          </h2>

          <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
            Get matched with top auditors based on stack, size, and risk profile.
            Skip the cold outreach — connect directly with vetted security experts.
          </p>

          <ul className="space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
            {[
              'Smart matching based on expertise',
              'Transparent pricing and timelines',
              'Verified track records and reviews',
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--blue-primary)] font-bold leading-[1.3]">•</span>
                {line}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            className="
              mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-lg
              bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)]
              text-white text-sm font-medium transition
            "
          >
            Join the waitlist →
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-full max-w-[420px]">
          <Image
            src="/images/AuditorPreview.png"
            alt="Auditor Marketplace Preview"
            width={420}
            height={320}
            className="rounded-2xl w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
