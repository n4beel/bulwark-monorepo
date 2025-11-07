'use client';

import useAuthWatcher from '@/shared/hooks/useAuthWatcher';
import { useGitHubAuth } from '@/shared/hooks/useGitHubAuth';
import { useHomepageLogout } from '@/shared/hooks/useHomePageLogout';

export default function AuthWatcher() {
  useAuthWatcher();
  useGitHubAuth();
  useHomepageLogout();
  return null;
}
