// hooks/useGitHubAuth.ts
"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

export const useGitHubAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userStr = urlParams.get("user");
    const redirectPath = urlParams.get("from") || "/dashboard";

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // Store token
        localStorage.setItem("github_token", token);

        // Create user info with proper fallbacks
        const userInfo = {
          uid:
            user.id?.toString() ||
            user._id?.toString() ||
            user.login ||
            Date.now().toString(),
          email: user.email || `${user.login}@github.user`,
          displayName:
            user.name || user.login || user.username || "GitHub User",
          photoURL: user.avatar_url || user.avatarUrl || user.photo || null,
        };

        // Dispatch to Redux
        dispatch(setUser(userInfo));

        // Clean URL and redirect
        window.history.replaceState({}, "", redirectPath);

        // Small delay to ensure Redux state is updated
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
      } catch (err) {}
    }
  }, [dispatch, router]);
};
