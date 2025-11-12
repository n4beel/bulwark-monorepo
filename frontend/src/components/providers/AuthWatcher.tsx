'use client';

import { useGitHubAuth } from '@/shared/hooks/useGitHubAuth';
import { useHomepageLogout } from '@/shared/hooks/useHomePageLogout';

export default function AuthWatcher() {
  useGitHubAuth();
  useHomepageLogout();
  return null;
}
