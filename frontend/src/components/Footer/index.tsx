"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-11/12 mx-auto bg-[var(--blue-primary)] text-white overflow-hidden pb-20">
      {/* Background watermark */}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--blue-dark)]/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company */}
          <div className="space-y-3 max-w-[230px]">
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
                  src="/icons/GithubSmall.svg"
                  alt="GitHub"
                  width={18}
                  height={18}
                  className="hover:opacity-80 transition"
                />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-2">
            <h4 className="font-normal text-white/90">Product</h4>
            <ul className="space-y-1 text-sm opacity-90">
              <li>
                <Link href="#">How it works</Link>
              </li>
              <li>
                <Link href="#">Pricing</Link>
              </li>
              <li>
                <Link href="#">Marketplace</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <h4 className="font-normal text-white/90">Resources</h4>
            <ul className="space-y-1 text-sm opacity-90">
              <li>
                <Link href="#">Documentation</Link>
              </li>
              <li>
                <Link href="#">Security</Link>
              </li>
              <li>
                <Link href="#">Status</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2">
            <h4 className="font-normal text-white/90">Legal</h4>
            <ul className="space-y-1 text-sm opacity-90">
              <li>
                <Link href="#">Terms of Service</Link>
              </li>
              <li>
                <Link href="#">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 w-full h-px bg-white/25" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 text-[13px] text-white/70">
          <p>© 2025 Bulwark. All rights reserved.</p>
          <p>Built for the future of secure smart contracts.</p>
        </div>
      </div>
      <div className=" flex justify-center items-end opacity-10 pointer-events-none">
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
