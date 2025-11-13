'use client';

import { useSelector } from 'react-redux';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store/store';
import StepResults from './StepResults';

type Props = {
  open: boolean;
  report: any;
  onClose: () => void;
  onViewDetailed?: (id: string) => void;
};

export default function ReceiptModal({
  open,
  report,
  onClose,
  onViewDetailed,
}: Props) {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isSaving] = useState(false);

  if (!open || !report) return null;

  const oid = typeof report?._id === 'string' ? report._id : report?._id?.$oid;

  // const handleSignupToSave = () => {
  //   handleGitHubLogin(`/dashboard?report=${oid}`, 'auth');
  // };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className="relative w-[95%] max-w-[660px] h-[80vh] md:h-[700px]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="absolute -top-2 -right-2 z-[20000] w-6 h-6 bg-white border border-gray-300 shadow rounded-full flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Receipt Container */}
        <div
          className="relative w-full h-full shadow-none flex flex-col border-t-[2px] border-l-[2px] border-r-[2px] overflow-visible"
          style={{
            borderColor: 'var(--blue-secondary)',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto md:overflow-y-hidden bg-white scroll-smooth relative">
            <StepResults report={report} />
          </div>

          {/* ✅ Floating Share Dock (now visible and not clipped) */}
          <div className="absolute right-[-50px] bottom-0 flex flex-col gap-2 z-[30000] max-md:right-2  bg-[var(--step-badge-bg)] pt-1 pb-0 rounded-t-3xl rounded-b-full">
            <button className="w-9 h-9 mx-auto bg-white rounded-xl shadow flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
              <Image
                src="/icons/Link.svg"
                alt="Copy Link"
                width={25}
                height={25}
              />
            </button>

            <button className="w-9 h-9 mx-auto bg-white rounded-xl shadow flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
              <Image
                src="/icons/X.svg"
                alt="Post to X"
                width={18}
                height={18}
              />
            </button>

            <button className="w-9 h-9 mx-auto bg-white rounded-xl shadow flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
              <Image
                src="/icons/LinkedIn.svg"
                alt="LinkedIn"
                width={18}
                height={18}
              />
            </button>

            <button className="w-11 h-11 bg-[var(--blue-primary)] rounded-xl shadow flex items-center justify-center cursor-pointer hover:bg-[var(--blue-hover)] transition">
              <Image
                src="/icons/Share.svg"
                alt="Share"
                width={25}
                height={25}
              />
            </button>
          </div>

          {/* Sticky Footer */}
          <div
            className="shrink-0 border-t-0 relative"
            style={{
              backgroundImage: "url('/icons/Reciept.svg')",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center bottom',
              backgroundSize: '100% auto',
              marginTop: '-6px',
            }}
          >
            <div className="px-6 py-2 flex justify-end gap-2 backdrop-blur-sm">
              {!user && (
                <button
                  className="border px-4 flex py-2 rounded-lg bg-white/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    oid &&
                      (onViewDetailed?.(oid) ??
                        router.push(`/dashboard?report=${oid}`));
                    onClose();
                  }}
                >
                  Signup to save
                </button>
              )}

              <button
                onClick={() => {
                  oid &&
                    (onViewDetailed?.(oid) ??
                      router.push(`/dashboard?report=${oid}`));
                  onClose();
                }}
                className="px-6 py-2 text-white bg-[var(--blue-primary)] rounded-lg cursor-pointer"
              >
                View Detailed Report →
              </button>
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
