'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { RootState } from '@/store/store';

export const useHomepageLogout = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { githubToken, jwtToken } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    // ✅ If user is logged in and visits homepage → logout
    if ((githubToken || jwtToken) && pathname === '/') {
      // dispatch(logout());
      // // Clear all localStorage tokens
      // localStorage.removeItem('github_token');
      // localStorage.removeItem('github_user');
      // localStorage.removeItem('jwt_token');
      // // Optionally reload or redirect
      // router.push('/');
    }
  }, [pathname, githubToken, jwtToken, dispatch, router]);
};
