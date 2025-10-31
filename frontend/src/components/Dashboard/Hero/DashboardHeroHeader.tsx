"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function DashboardHeroHeader() {
  const user = useSelector((state: RootState) => state.auth.user);
  const name = user?.displayName || user?.email || "User";

  return (
    <div className="w-full text-center mt-10 flex flex-col items-center gap-3">
      {/* Profile Initial Badge */}

      {/* Welcome Title */}
      <h1 className="text-3xl font-normal tracking-wide doto">
        👋 <span className="text-[var(--text-primary)]">Welcome, </span>
        <span className="text-[var(--blue-primary)]">{name}</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[var(--text-secondary)] text-sm">
        View and manage your static analysis reports
      </p>
    </div>
  );
}
