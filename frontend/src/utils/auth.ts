import { authApi } from "@/services/api";

export const handleGitHubLogin = async (
  redirectPath?: string,
  mode: "auth" | "connect" = "auth"
) => {
  try {
    const from = redirectPath || window.location.pathname;

    const { authUrl } = await authApi.getGitHubAuthUrl(from, mode);

    window.location.href = authUrl;
  } catch (error) {
    throw error;
  }
};
