"use client";

import { useEffect } from "react";
import { useSelector } from "react-redux";

import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import DashboardNavbar from "@/components/Dashboard/DashboardNavBar";
import DashboardHero from "@/components/Dashboard/Hero";
import Loading from "@/components/Loading";
import AuthModal from "@/components/auth/AuthModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  // ✅ Prevent screen flash while auth is loading
  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--background)]">
        <DashboardNavbar />
        <DashboardHero />
      </main>
      <AuthModal
        open={!user}
        onClose={() => {
          router.push("/");
        }}
        shouldRedirect={false}
      />
    </>
  );
}
