'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { setTokens, setUser } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';

export const useGitHubAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { githubToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        const mode = user.mode || 'auth';
        let from = user.from || '/dashboard';
        const reportId =
          user.reportId && user.reportId !== '' ? user.reportId : null;

        const userInfo = {
          uid: user.id || user._id,
          email: user.email || `${user.githubUsername}@github.user`,
          displayName: user.name || user.githubUsername || 'GitHub User',
          photoURL: user.avatarUrl || null,
        };

        dispatch(setUser(userInfo));
        dispatch(
          setTokens({
            githubToken: token,
            jwtToken: user.jwtToken,
          }),
        );

        if (reportId) {
          from = `/dashboard?report=${reportId}`;
        }

        const fromPathname = from.split('?')[0];

        // ✅ Logic based on from + mode
        if (mode === 'connect') {
          sessionStorage.setItem('open_github_flow', 'true');
          window.history.replaceState({}, '', from);
          router.push(from);
        } else if (mode === 'auth') {
          if (fromPathname === '/') {
            const dashboardPath = reportId
              ? `/dashboard?report=${reportId}`
              : '/dashboard';

            window.history.replaceState({}, '', dashboardPath);
            router.push(dashboardPath);
          } else {
            window.history.replaceState({}, '', from);
            router.push(from);
          }
        }
      } catch (err) {}
    }

    // if (githubToken && pathname === '/') {
    //   dispatch(logout());
    //   localStorage.removeItem('github_token');
    //   localStorage.removeItem('github_user');
    //   localStorage.removeItem('jwt_token');
    //   router.push('/'); // stay or reload homepage
    // }
  }, [dispatch, router]);
};
