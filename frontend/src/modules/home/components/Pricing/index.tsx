'use client';

import Image from 'next/image';
import PaidPricingCard from '../../../../shared/components/PaidPricingCard';

export default function PricingSection() {
  return (
    <section
      className="w-full py-24 px-6 relative overflow-hidden" // ✅ changed: prevent horizontal scroll
      id="pricing"
    >
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-4xl font-normal doto text-[var(--text-primary)] tracking-normal leading-tight">
          Want to go deeper for critical
          <br /> vulnerabilities and attack vectors?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Upgrade to Bulwark Forensic™ to spot critical vulnerabilities via
          audit agent-based code reviews
        </p>
      </div>

      {/* Cards layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-start max-w-4xl mx-auto">

        {/* FREE CARD */}
        <div className="relative bg-white rounded-2xl border border-[#DDE3F7] p-8 shadow-sm h-full">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Free Scan</p>
          <p className="text-3xl font-semibold text-black">$0</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Perfect for getting started
          </p>

          <ul className="mt-6 space-y-3 text-sm text-black/80">
            {[
              'Up to 5 scans per month',
              'Basic risk assessment',
              'Cost estimates',
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3">
                <Image src="/icons/Check.svg" alt="Check" width={14} height={14} />
                {t}
              </li>
            ))}
          </ul>

          <button className="mt-8 px-5 py-2 border border-[var(--blue-primary)] text-[var(--blue-primary)] cursor-pointer rounded-lg hover:bg-[var(--blue-primary)] hover:text-white transition">
            Sign Up now
          </button>
        </div>

        {/* FORENSIC CARD */}
        <div className="relative z-10">

          {/* 💎 Diamond Background */}
          <Image
            src="/icons/Diamond.svg"
            alt="Diamond"
            width={420}
            height={420}
            className="
              hidden md:block
              absolute
              -right-80
              top-1/2
              -translate-y-1/2
              opacity-70
              pointer-events-none
              select-none
              z-0
            "
          />

          {/* ✅ Mobile-safe alternative diamond */}
          <div className="md:hidden absolute inset-0 flex justify-center items-start opacity-10 z-0 pointer-events-none">
            <Image
              src="/icons/Diamond.svg"
              alt="Diamond"
              width={220}
              height={220}
              className="object-contain"
            />
          </div>

          {/* Blurred Forensic Card */}
          <div className="relative bg-transparent border border-[var(--blue-primary)] backdrop-blur-[40px] shadow-lg rounded-2xl p-8 z-10">
            <span className="inline-flex items-center gap-2 text-xs bg-[var(--blue-primary)] text-white px-3 py-1 rounded-full">
              Forensic
              <Image src="/icons/DiamondSmall.svg" alt="arrowright" width={25} height={25} />
            </span>

            <PaidPricingCard />
          </div>
        </div>
      </div>

      <p className="mt-10 text-sm text-[var(--text-secondary)] opacity-60 text-center">
        Need a custom solution? We offer white-label options and API access for platforms.
      </p>
    </section>
  );
}
