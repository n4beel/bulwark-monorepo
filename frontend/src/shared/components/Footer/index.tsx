'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative w-11/12 mx-auto bg-[var(--blue-primary)] text-white overflow-hidden pb-0 rounded-t-2xl">

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--blue-dark)]/30 via-transparent to-transparent pointer-events-none" />

      {/* Content Wrapper */}
      <div className="relative w-full mx-auto px-6 py-16">

        <div className="flex flex-col md:flex-row justify-between items-start gap-12 md:gap-8">

          {/* Left Section */}
          <div className="space-y-4 max-w-[260px]">
            <p className="text-sm leading-snug opacity-90">
              Instant pre-audit reports for smart contracts.
              Built for modern web3 teams.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4 mt-2">
              <Link href="#" aria-label="Twitter">
                <Image
                  src="/icons/TwitterSmall.svg"
                  alt="Twitter"
                  width={20}
                  height={20}
                  className="hover:opacity-80 transition cursor-pointer"
                />
              </Link>
              <Link href="#" aria-label="GitHub">
                <Image
                  src="/icons/GitHubSmall.svg"
                  alt="GitHub"
                  width={20}
                  height={20}
                  className="hover:opacity-80 transition cursor-pointer"
                />
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-2 max-w-[260px] md:text-right text-left">
            <p className="text-sm leading-snug opacity-90">
              For queries and information, contact:
            </p>
            <p className="text-sm font-medium">
              bulwark@blockapex.io
            </p>
          </div>

        </div>
      </div>

      {/* ✅ Watermark – remains large but centered + responsive */}
      <div className="flex justify-center items-end opacity-15 pointer-events-none w-full">
        <Image
          src="/icons/BulwarkWatermark.svg"
          alt="Bulwark watermark"
          width={1000}
          height={400}
          className="w-full max-w-[900px] object-contain"
          priority
        />
      </div>

      {/* Divider */}
      <div className="w-[95%] mx-auto border-t border-white/20 mt-12" />

      {/* Bottom Legal */}
      <div className="text-start md:text-right text-xs text-white/70 py-6 select-none px-6">
        © 2025 Bulwark. All rights reserved.
      </div>
    </footer>
  );
}
