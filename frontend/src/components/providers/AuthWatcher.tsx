"use client";
import useAuthWatcher from "@/hooks/useAuthWatcher";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";

export default function AuthWatcher() {
  useAuthWatcher();
  useGitHubAuth();
  return null;
}
