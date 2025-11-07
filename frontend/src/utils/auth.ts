import { authApi } from '@/services/api';

export const handleGitHubLogin = async (
  redirectPath?: string,
  mode: 'auth' | 'connect' = 'auth',
) => {
  try {
    const from = redirectPath || window.location.pathname;

    const { authUrl } = await authApi.getGitHubAuthUrl(from, mode);

    window.location.href = authUrl;
  } catch (error) {
    console.error('Error during GitHub login:', error);
    throw error;
  }
};

export const handleGoogleLogin = async (
  redirectPath?: string,
  mode: 'auth' | 'connect' = 'auth',
) => {
  try {
    const from = redirectPath || window.location.pathname;

    const { authUrl } = await authApi.getGoogleAuthUrl(from, mode);

    window.location.href = authUrl;
  } catch (error) {
    console.error('Error during Google login:', error);
    throw error;
  }
};
