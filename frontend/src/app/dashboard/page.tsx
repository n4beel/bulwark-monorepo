"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";

import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import DashboardNavbar from "@/components/Dashboard/DashboardNavBar";
import DashboardHero from "@/components/Dashboard/Hero";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // ✅ Wait until loading is finished
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // ✅ Prevent screen flash while auth is loading
  if (loading) {
    return <div className="text-center mt-20">Checking authentication...</div>;
  }

  // ✅ If user still missing after loading → will redirect above
  if (!user) return null;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <DashboardNavbar />
      <DashboardHero />
    </main>
  );
}
