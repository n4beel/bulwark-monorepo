"use client";
import Image from "next/image";
import PaidPricingCard from "../PaidPricingCard";

export default function PricingSection() {
  return (
    <section className="w-full py-24 px-6 relative overflow-visible">
      {/* ✅ RIGHT SIDE DIAMOND — OUTSIDE CARD */}
      <Image
        src={"/icons/Diamond.svg"}
        alt="Diamond"
        width={420}
        height={420}
        className="hidden md:block absolute -right-0 top-[20%] blur-[3px] pointer-events-none select-none z-30"
      />

      <div className="max-w-7xl mx-auto text-center mb-12">
        <h2 className="text-4xl font-extrabold doto tracking-widest text-[var(--text-primary)]">
          Ready to Secure Your Smart Contracts?
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Start with a free pre-audit scan. No credit card required.
        </p>
      </div>
      {/* card sould be in center */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-start max-w-4xl mx-auto">
        {/* ✅ FREE CARD */}
        <div
          className="relative bg-white rounded-2xl border border-[#DDE3F7] p-8 shadow-sm h-full
"
        >
          <p className="text-xs text-[var(--text-secondary)] mb-2">Free Scan</p>
          <p className="text-3xl font-semibold text-black">$0</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Perfect for getting started
          </p>

          <ul className="mt-6 space-y-3 text-sm text-black/80">
            {[
              "Up to 5 scans per month",
              "Basic risk assessment",
              "Cost estimates",
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3">
                <Image
                  src="/icons/Check.svg"
                  alt="Check"
                  width={14}
                  height={14}
                />
                {t}
              </li>
            ))}
          </ul>

          <button className="mt-8 px-5 py-2 border border-[var(--blue-primary)] text-[var(--blue-primary)] cursor-pointer rounded-lg hover:bg-[var(--blue-primary)] hover:text-white transition">
            Start free scan
          </button>
        </div>

        {/* ✅ FORENSIC CARD */}
        <div
          className="relative bg-white rounded-2xl border border-[#DDE3F7] p-8 shadow-sm h-full
"
        >
          <span className="inline-flex items-center gap-2 text-xs bg-[var(--blue-primary)] text-white px-3 py-1 rounded-full">
            Forensic{" "}
            <Image
              src={"/icons/DiamondSmall.svg"}
              alt="arrowright"
              width={25}
              height={25}
            />
          </span>

          <PaidPricingCard />
        </div>
      </div>

      <p className="mt-10 text-sm text-[var(--text-secondary)] opacity-60 text-center">
        Need a custom solution? We offer white-label options and API access for
        platforms.
      </p>
    </section>
  );
}
