"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import StandardImage from "./StandardImage";
import ThemeToggle from "./ThemeToggle";
import { Tabs } from "@/constants/navbar";
import AuthModal from "./auth/AuthModal";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState("");
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
  };

  const handleScrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    if (typeof window !== "undefined") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="bg-[var(--background)] fixed top-0 left-0 w-full z-50 border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer">
          <StandardImage
            src="/icons/Bulwark.svg"
            alt="Bulwark Logo"
            width={145}
            height={32}
          />
        </div>

        <div className="hidden md:flex space-x-8">
          {Tabs.map((tab) => {
            const tabId = tab.toLowerCase().replace(/\s+/g, "-");
            return (
              <button
                key={tab}
                onClick={() => handleScrollToSection(tabId)}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ✅ User Info or Sign-in Button */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[var(--button-primary)] cursor-pointer hover:bg-[var(--button-primary-hover)] text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="bg-[var(--button-primary)] cursor-pointer hover:bg-[var(--button-primary-hover)] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
};

export default Navbar;
