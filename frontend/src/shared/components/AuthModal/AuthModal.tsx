'use client';

import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { handleGitHubLogin, handleGoogleLogin } from '@/utils/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  shouldRedirect?: boolean;
  redirectPath?: string;
}

export default function AuthModal({
  open,
  onClose,
  shouldRedirect = true,
  redirectPath = '/dashboard',
}: Props) {
  if (!open) return null;

  const dispatch = useDispatch();
  const router = useRouter();

  const redirectToDashboard = () => {
    onClose();
    if (shouldRedirect) {
      router.push(redirectPath);
    }
  };

  const loginWithGoogle = useCallback(async () => {
    try {
      // const result = await signInWithPopup(auth, googleProvider);
      // const user = result.user;

      // dispatch(
      //   setUser({
      //     uid: user.uid,
      //     email: user.email,
      //     displayName: user.displayName,
      //     photoURL: user.photoURL,
      //   }),
      // );
      await handleGoogleLogin(redirectPath, 'auth');
      // redirectToDashboard();
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }, [shouldRedirect, redirectPath]);

  const loginWithGitHub = useCallback(async () => {
    try {
      // ✅ Always use mode: "auth" for AuthModal
      await handleGitHubLogin(redirectPath, 'auth');
    } catch (error) {
      console.error('GitHub login failed:', error);
    }
  }, [redirectPath]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-10 text-center border border-[var(--blue-primary)] shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 cursor-pointer right-4 text-[var(--gray-medium)] hover:text-[var(--gray-dark)] transition"
        >
          ✕
        </button>

        <Image
          src="/images/SigninImage.png"
          width={256}
          height={200}
          alt="Bulwark logo"
          className="mx-auto mb-4"
        />

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed px-4">
          Sign in and start scanning your Solana programs. Get access to your
          saved reports and deeper insights into your codebase.
        </p>

        <div className="space-y-3 mt-8">
          <button
            onClick={loginWithGoogle}
            className="w-full rounded-lg p-3 flex cursor-pointer items-center justify-center gap-3 border border-[var(--border-color)] hover:border-[var(--blue-primary)] hover:bg-[var(--gray-light)] transition"
          >
            <Image src="/icons/Google.svg" width={18} height={18} alt="" />
            <span className="text-[var(--text-primary)]">
              Sign-in with Google
            </span>
          </button>

          <button
            onClick={loginWithGitHub}
            className="w-full rounded-lg p-3 cursor-pointer flex items-center justify-center gap-3 border border-[var(--border-color)] hover:border-[var(--blue-primary)] hover:bg-[var(--gray-light)] transition"
          >
            <Image src="/icons/GitHubIcon.svg" width={18} height={18} alt="" />
            <span className="text-[var(--text-primary)]">
              Sign-in with GitHub
            </span>
          </button>
        </div>

        <div className="border-t border-[var(--border-color)] mt-6 mb-4 w-4/5 mx-auto" />

        <p className="text-xs text-[var(--text-secondary)]">
          <span className="underline cursor-default">Single sign-on (SSO)</span>{' '}
          <span className="bg-[var(--green-light)] text-[10px] text-[var(--green-dark)] px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </p>

        <p className="text-[10px] text-[var(--gray-medium)] mt-4 leading-normal">
          🔒 Encrypted by Arcium. Bulwark never processes plaintext code.
        </p>
      </div>
    </div>
  );
}
