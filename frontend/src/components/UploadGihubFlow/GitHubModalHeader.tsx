"use client";

interface Props {
  step: "repoSelect" | "fileSelect" | "progress";
  onClose: () => void;
}

const steps = ["Select Repo", "Select Files", "Analyze"] as const;

export default function GitHubModalHeader({ step, onClose }: Props) {
  return (
    <div className="relative">
      <div className="h-[5px] w-full bg-[var(--border-color)] rounded-t-[26px]">
        <div
          className="h-full bg-[var(--button-primary)] transition-all rounded-tl-[26px]"
          style={{
            width:
              step === "repoSelect"
                ? "33%"
                : step === "fileSelect"
                ? "66%"
                : "100%",
          }}
        />
      </div>

      <div className="flex justify-between px-10 pt-2 pb-2">
        {steps.map((label) => {
          const isActive =
            (step === "repoSelect" && label === "Select Repo") ||
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
