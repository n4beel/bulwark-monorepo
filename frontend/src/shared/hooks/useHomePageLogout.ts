'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';

export const useHomepageLogout = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { githubToken, jwtToken } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    if ((githubToken || jwtToken) && pathname === '/') {
      dispatch(logout());

      localStorage.removeItem('github_token');
      localStorage.removeItem('github_user');
      localStorage.removeItem('jwt_token');

      router.push('/');
    }
  }, [pathname, githubToken, jwtToken, dispatch, router]);
};
