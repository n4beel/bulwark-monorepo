"use client";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RootState } from "@/store/store";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  if (!user) return null;

  return <>{children}</>;
}
