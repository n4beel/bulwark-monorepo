// components/Navbar.tsx
"use client";

import { useState } from "react";
import StandardImage from "./StandardImage";
import ThemeToggle from "./ThemeToggle";
import { Tabs } from "@/constants/navbar";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState<string>("");

  // Scroll to section handler
  const handleScrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    // Only run on client side to prevent hydration mismatch
    if (typeof window !== "undefined") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="bg-[var(--background)] fixed top-0 left-0 w-full z-50 border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <StandardImage
            src="/icons/Bulwark.svg"
            alt="Bulwark Logo"
            width={145}
            height={32}
            className="h-8 w-auto"
          />
        </div>

        {/* Scrollable Tabs */}
        <div className="flex space-x-8 overflow-x-auto no-scrollbar">
          {Tabs.map((tab) => {
            const tabId = tab.toLowerCase().replace(/\s+/g, "-");
            const isActive = activeTab === tabId;
            return (
              <button
                key={tab}
                onClick={() => handleScrollToSection(tabId)}
                className={`text-sm font-medium cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--navbar-active)]"
                    : "text-[var(--navbar-inactive)] hover:text-[var(--navbar-active)]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sign In / User Info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Stop redirecting - just show a message or handle sign in logic here
              console.log("Sign In clicked - redirect disabled");
              // You can add your sign in logic here instead of redirecting
            }}
            className="bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
