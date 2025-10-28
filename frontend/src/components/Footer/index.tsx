"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-11/12 mx-auto bg-[var(--blue-primary)] text-white overflow-hidden pb-20">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--blue-dark)]/20 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative w-full mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Left — Company info */}
          <div className="space-y-3 max-w-[260px]">
            <p className="text-sm leading-snug opacity-90">
              Instant pre-audit reports for smart contracts. Built for modern
              web3 teams.
            </p>

            <div className="flex gap-4 mt-4">
              <Link href="#" aria-label="Twitter">
                <Image
                  src="/icons/TwitterSmall.svg"
                  alt="Twitter"
                  width={18}
                  height={18}
                  className="hover:opacity-80 transition"
                />
              </Link>
              <Link href="#" aria-label="GitHub">
                <Image
                  src="/icons/GitHubSmall.svg"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="hover:opacity-80 transition"
                />
              </Link>
            </div>
          </div>

          {/* Right — Queries */}
          <div className="space-y-3 max-w-[260px]">
            <p className="text-sm leading-snug opacity-90">
              For queries and information please reach us at:
              <br />
              <span className="font-semibold ">bulwark@blockapex.io</span>
            </p>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="flex justify-center items-end opacity-10 pointer-events-none">
        <Image
          src="/icons/BulwarkWatermark.svg"
          alt="Bulwark watermark"
          width={1200}
          height={500}
          priority
        />
      </div>
    </footer>
  );
}
