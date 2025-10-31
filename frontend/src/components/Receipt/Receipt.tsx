"use client";

import { useEffect, useState } from "react";
import StepResults from "./StepResults";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { staticAnalysisApi } from "@/services/api"; // ✅ Import the API
import { handleGitHubLogin } from "@/utils/auth";

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
  const [isSaving, setIsSaving] = useState(false);

  if (!open || !report) return null;

  const oid = typeof report?._id === "string" ? report._id : report?._id?.$oid;

  // // ✅ Handle save to reports
  // const handleSaveToReports = async () => {
  //   if (!user) {
  //     // Redirect to login/signup
  //     router.push("/dashboard");
  //     return;
  //   }

  //   if (!oid) {
  //     console.error("No report ID found");
  //     return;
  //   }

  //   try {
  //     setIsSaving(true);
  //     await staticAnalysisApi.associateReport(oid);

  //     // Success! Navigate to dashboard
  //     router.push("/dashboard");
  //     onClose();
  //     onViewDetailed?.(oid);
  //   } catch (error) {
  //     console.error("Failed to save report:", error);
  //     // Optionally show error toast/notification
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const handleSignupToSave = () => {
    handleGitHubLogin(`/dashboard?report=${oid}`, "auth");
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[660px] h-[700px]">
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
          }}
        >
          {/* Scrollable results */}
          <div className="flex-1 overflow-hidden bg-white">
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
              marginTop: "-6px",
            }}
          >
            <div className="px-6 py-2 flex justify-end gap-2 backdrop-blur-sm">
              <button
                className="border px-4 flex py-2 rounded-lg bg-white/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSignupToSave}
                disabled={isSaving}
              >
                {!user && "Signup to save"}
              </button>

              <button
                onClick={() =>
                  oid &&
                  (onViewDetailed?.(oid) ??
                    router.push(`/dashboard?report=${oid}`))
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
