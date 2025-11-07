"use client";

import StandardImage from "@/components/StandardImage";
import type { RootState } from "@/store/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import AuthModal from "../AuthModal/AuthModal";
import ComingSoonChip from "../ComingSoonChip";

type TabItem = { id: string; label: string; href?: string; disabled?: boolean };

const TABS: TabItem[] = [
  { id: "analyze", label: "Analyze", href: "#analyze" },
  { id: "how", label: "How it works", href: "#how" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
  { id: "market", label: "Marketplace", disabled: true },
];

export default function Navbar() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);
  const [openAuth, setOpenAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onTabClick = (tab: TabItem) => {
    if (tab.disabled) return;

    if (tab.id === "dashboard" && user) {
      router.push("/dashboard");
      return;
    }

    if (tab.href?.startsWith("#")) {
      const el = document.querySelector(tab.href);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>

    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        
        {/* Logo */}
        <button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
          aria-label="Bulwark home"
        >
          <StandardImage
            src="/icons/Bulwark.svg"
            alt="Bulwark"
            width={140}
            height={28}
          />
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex">
          <ul className="flex items-center gap-8">
            {TABS.map((t) => (
              <li key={t.id} className="relative">
                <button
                  onClick={() => onTabClick(t)}
                  disabled={t.disabled}
                  className={`text-sm font-medium transition flex items-center gap-2
                    ${
                      t.disabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    }`}
                >
                  {t.label}
                  {t.disabled && (
                    <span className="absolute -right-28 -top-[3px]">
                      <ComingSoonChip />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side: Auth + Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-color)] cursor-pointer"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Auth Button */}
         
            <button
              onClick={() => setOpenAuth(true)}
              className="hidden md:inline-flex items-center cursor-pointer rounded-md bg-[var(--button-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--button-primary-hover)]"
            >
              Sign in
            </button>
          
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-white/95 backdrop-blur">
          <nav className="container-app">
            <ul className="flex flex-col py-2">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      onTabClick(t);
                      setMobileOpen(false);
                    }}
                    disabled={t.disabled}
                    className={`w-full text-left px-2 py-3 text-sm flex items-center justify-between
                      ${
                        t.disabled
                          ? "text-gray-400"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      }`}
                  >
                    {t.label}
                    {t.disabled && <ComingSoonChip />}
                  </button>
                </li>
              ))}
              <li className="px-2 py-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full items-center justify-center cursor-pointer rounded-md border border-[var(--border-color)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setOpenAuth(true);
                      setMobileOpen(false);
                    }}
                    className="inline-flex w-full items-center justify-center cursor-pointer rounded-md bg-[var(--button-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--button-primary-hover)]"
                  >
                    Sign in
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}

   
    </header>
       <AuthModal open={openAuth} onClose={() => setOpenAuth(false)} />
            </>
  );
}
