"use client";

import { useEffect } from "react";
import StepResults from "./StepResults";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  if (!open || !report) return null;

  const oid = typeof report?._id === "string" ? report._id : report?._id?.$oid;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[720px] h-[700px]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          type="button"
          className="absolute -top-2 -right-2 z-[10000] w-6 h-6 bg-white border border-gray-300 shadow rounded-full flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
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

        <div
          className="relative w-full h-full shadow-none overflow-hidden flex flex-col border-t-[2px] border-l-[2px] border-r-[2px]"
          style={{
            borderColor: "var(--blue-secondary)",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            // backgroundColor: "#FFFFFF",
          }}
        >
          {/* Scrollable results */}
          <div className="flex-1 overflow-y-auto bg-white">
            <StepResults report={report} />
          </div>

          {/* Sticky Receipt Footer */}
          <div
            className="shrink-0 border-t-0"
            style={{
              backgroundImage: "url('/icons/Reciept.svg')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center bottom",
              backgroundSize: "100% auto",
              marginTop: "-6px", // ✅ brings scallops INTO view, not clipped
            }}
          >
            <div className="px-6 py-4 flex justify-end gap-3 backdrop-blur-sm">
              <button
                className="border px-4 py-2 rounded-lg bg-white/80 cursor-pointer"
                onClick={() => router.push("/dashboard")}
              >
                Signup to save
              </button>

              <button
                onClick={() =>
                  oid &&
                  (onViewDetailed?.(oid) ??
                    router.push(`/report-summary/${oid}`))
                }
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
