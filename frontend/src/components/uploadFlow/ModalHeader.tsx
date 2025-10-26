"use client";
import { X } from "lucide-react";

interface Props {
  step: "upload" | "fileSelect" | "progress";
  onClose: () => void;
}

const steps = ["Upload", "Select Files", "Analyze"] as const;

export default function ModalHeader({ step, onClose }: Props) {
  return (
    <div className="relative">
      {/* Progress Bar */}
      <div className="h-[5px] w-full bg-[var(--border-color)] rounded-t-[26px]">
        <div
          className="h-full bg-[var(--button-primary)] transition-all rounded-tl-[26px]"
          style={{
            width:
              step === "upload"
                ? "33%"
                : step === "fileSelect"
                ? "66%"
                : "100%",
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-between px-10 pt-2 pb-2">
        {steps.map((label) => {
          const isActive =
            (step === "upload" && label === "Upload") ||
            (step === "fileSelect" && label === "Select Files") ||
            (step === "progress" && label === "Analyze");

          return (
            <div key={label} className="flex flex-col items-center">
              <span
                className={`text-[13px] no-underline ${
                  isActive
                    ? "text-[var(--navbar-active)] font-medium"
                    : "text-[var(--navbar-inactive)] font-normal"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
