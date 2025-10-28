"use client";

import Image from "next/image";
import PaidPricingCard from "../PaidPricingCard";

interface UpgradeForensicModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeForensicModal({
  open,
  onClose,
}: UpgradeForensicModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-10">
        {/* Close Btn */}
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="absolute -top-2 -right-2 z-[10000] w-6 h-6 bg-white border border-gray-300 shadow cursor-pointer rounded-full flex items-center justify-center hover:bg-gray-200 transition"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {/* Title */}
        <h2 className="text-center text-[28px] font-semibold doto text-[#0F172A] mb-10">
          Upgrade to Forensic
        </h2>

        {/* Body Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* ✅ Left Card */}
          <div className="bg-[var(--gray-light)]/40 rounded-2xl  pb-6 flex flex-col items-center justify-center">
            {/* Icon */}

            <Image
              src="/icons/ForensicDiamond.svg"
              alt="Forensic Diamond"
              width={300}
              height={200}
            />
          </div>

          <PaidPricingCard />
        </div>
      </div>
    </div>
  );
}
