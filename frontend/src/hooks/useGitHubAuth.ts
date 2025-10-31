"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, setTokens } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

export const useGitHubAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userStr = urlParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        const mode = user.mode || "auth";
        let from = user.from || "/dashboard";
        const reportId =
          user.reportId && user.reportId !== "" ? user.reportId : null;

        const userInfo = {
          uid: user.id || user._id,
          email: user.email || `${user.githubUsername}@github.user`,
          displayName: user.name || user.githubUsername || "GitHub User",
          photoURL: user.avatarUrl || null,
        };

        dispatch(setUser(userInfo));
        dispatch(
          setTokens({
            githubToken: token,
            jwtToken: user.jwtToken,
          })
        );

        if (reportId) {
          from = `/dashboard?report=${reportId}`;
        }

        const fromPathname = from.split("?")[0];

        // ✅ Logic based on from + mode
        if (mode === "connect") {
          sessionStorage.setItem("open_github_flow", "true");
          window.history.replaceState({}, "", from);
          router.push(from);
        } else if (mode === "auth") {
          if (fromPathname === "/") {
            const dashboardPath = reportId
              ? `/dashboard?report=${reportId}`
              : "/dashboard";

            window.history.replaceState({}, "", dashboardPath);
            router.push(dashboardPath);
          } else {
            window.history.replaceState({}, "", from);
            router.push(from);
          }
        }
      } catch (err) {}
    }
  }, [dispatch, router]);
};
