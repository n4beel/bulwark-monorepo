"use client";
import Image from "next/image";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation"; // ✅ correct router for app directory

interface Props {
  open: boolean;
  onClose: () => void;
  shouldRedirect?: boolean;
}

export default function AuthModal({
  open,
  onClose,
  shouldRedirect = true,
}: Props) {
  if (!open) return null;
  const dispatch = useDispatch();
  const router = useRouter();

  const redirectToDashboard = () => {
    onClose();
    router.push("/dashboard"); // ✅ redirect after auth success
  };
  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    dispatch(
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      })
    );
    if (shouldRedirect) redirectToDashboard();
  }, [onClose]);

  const loginWithGithub = useCallback(async () => {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    dispatch(
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      })
    );
    if (shouldRedirect) redirectToDashboard();
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-[var(--white)] rounded-2xl shadow-2xl p-10 max-w-lg w-full relative text-center border border-[var(--blue-primary)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 cursor-pointer right-4 text-[var(--gray-medium)] hover:text-[var(--gray-dark)] transition"
        >
          ✕
        </button>

        {/* Logo */}
        <Image
          src="/icons/BulwarkAuth.svg"
          width={256}
          height={200}
          alt="Bulwark logo"
          className="mx-auto mb-4"
        />

        {/* Title Text */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed px-4">
          Sign in and start scanning your Solana programs. Get access to your
          saved reports and deeper insights into your codebase.
        </p>

        {/* Buttons */}
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
            onClick={loginWithGithub}
            className="w-full rounded-lg p-3 cursor-pointer flex items-center justify-center gap-3 border border-[var(--border-color)] hover:border-[var(--blue-primary)] hover:bg-[var(--gray-light)] transition"
          >
            <Image src="/icons/GitHubIcon.svg" width={18} height={18} alt="" />
            <span className="text-[var(--text-primary)]">
              Sign-in with GitHub
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-color)] mt-6 mb-4 w-4/5 mx-auto" />

        {/* SSO (coming soon) */}
        <p className="text-xs text-[var(--text-secondary)]">
          <span className="underline cursor-default">Single sign-on (SSO)</span>{" "}
          <span className="bg-[var(--green-light)] text-[10px] text-[var(--green-dark)] px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        </p>

        {/* Bottom Info */}
        <p className="text-[10px] text-[var(--gray-medium)] mt-4 leading-normal">
          🔒 Encrypted by Arcium. Bulwark never processes plaintext code.
        </p>
      </div>
    </div>
  );
}
