import { authApi } from "@/services/api";

export const handleGitHubLogin = async () => {
  try {
    const { authUrl } = await authApi.getGitHubAuthUrl();

    window.location.href = authUrl;
  } catch (error) {
    console.error("GitHub login failed:", error);
  }
};
