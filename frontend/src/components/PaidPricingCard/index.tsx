"use client";
import React from "react";
import Image from "next/image";

const PaidPricingCard = () => {
  return (
    <div>
      <p className="mt-4 text-3xl font-normal text-black">200$ /mo</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        Unlimited Scans, Vulnerability Assessment Included
      </p>

      <ul className="mt-6 space-y-3 text-sm text-black/80">
        {[
          "Unlimited scans",
          "Advanced vulnerability detection",
          "Priority support & SLA",
        ].map((t, i) => (
          <li key={i} className="flex items-center gap-3">
            <Image src="/icons/Check.svg" alt="Check" width={14} height={14} />
            {t}
          </li>
        ))}
      </ul>

      <button className="mt-8 w-full inline-flex items-center justify-between gap-2 px-2 py-3 rounded-lg cursor-pointer text-white bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] transition">
        <div>
          Get now<span className="opacity-50 text-xs"> (Coming Soon)</span>
        </div>

        <Image
          src={"/icons/ArrowRightDotted.svg"}
          alt="arrowright"
          width={14}
          height={14}
        />
      </button>
    </div>
  );
};

export default PaidPricingCard;
