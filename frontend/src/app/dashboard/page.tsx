"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import DashboardNavbar from "@/components/Dashboard/DashboardNavBar";
import DashboardHero from "@/components/Dashboard/Hero";
import Loading from "@/components/Loading";
import AuthModal from "@/components/auth/AuthModal";
import { logout } from "@/store/slices/authSlice";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.auth);

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
