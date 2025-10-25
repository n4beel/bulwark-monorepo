"use client";

import { Stage, useAnalysisAnimator } from "@/hooks/useAnalysisAnimator";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";

interface Props {
  onComplete?: () => void;
  apiReady?: boolean;
}

const STAGES: Stage[] = [
  {
    title: "Parsing rust files",
    weight: "",
    iconPending: "/icons/TickMark.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [],
  },
  {
    title: "Computing complexity scores",
    weight: "20/100",
    iconPending: "/icons/TickMark.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [
      "Lines Of Code",
      "Number of functions/instructions handlers",
      "Code Complexity & Control Flow",
      "Modularity and Files/Modules Count",
      "Documentation & Clarity",
      "External Dependencies",
      "Testing Coverage & QA",
    ],
  },
  {
    title: "Detecting security vulnerability hotspots",
    weight: "30/100",
    iconPending: "/icons/ShieldIconGrey.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [
      "Access-Controlled Handler",
      "PDA Seed Surface & Ownership",
      "Cross-Program Invocation (CPI)",
      "Input/Constraint Surface (Accounts & Params)",
      "Arithmetic Operation",
      "Privileged Roles & Admin Action",
      "Unsafe / Low-Level Usage",
      "Error-Handling Footprint",
    ],
  },
  {
    title: "Calculating Audit Effort Units (AEU)",
    weight: "20/100",
    iconPending: "/icons/GraphIconGrey.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [
      "Upgradeability and Governance Control",
      "External Integration & Oracles",
      "Composability and Inter-Program Complexity",
      "Statefulness and Sequence of Operations",
      "Denial of Service & Resource Limits",
      "Operational Security Factors",
    ],
  },
  {
    title: "Issuing commit-bound receipt via Arcium",
    weight: "30/100",
    iconPending: "/icons/DocumentIconGrey.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [
      "Financial Logic Intricacy",
      "Number of Assets and Asset Types",
      "Invariants and Risk Parameters",
      "Oracle and Price Feed Usage",
      "Potential Profit Attack Vectors",
      "Value at Risk & Asset Volume",
      "Game Theory and Incentives",
    ],
  },
];

export default function StepAnalysisProgress({
  onComplete,
  apiReady = false,
}: Props) {
  const { phase, stageIdx, visibleSubs, overallPct } = useAnalysisAnimator(
    STAGES,
    {
      apiReady: apiReady,
      perSubtitleMs: 100,
      interStagePauseMs: 100,
      finishDelayMs: 100,
    },
    onComplete
  );

  const getStageState = (index: number) => {
    if (index === 0) {
      return phase === "parsing" ? "blinking" : "done";
    }
    if (index < stageIdx) return "done";
    if (index === stageIdx && phase === "analyzing") return "current";
    return "pending";
  };

  return (
    <div className="px-8 pt-4 pb-8 min-h-[520px] flex flex-col">
      {/* Top Video Banner */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--gray-light)]/40 p-6 mb-6">
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
            Running encrypted analysis on Arcium
          </p>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-28 h-28 rounded-lg"
          >
            <source src="/videos/AnalyzerLoader.webm" type="video/webm" />
          </video>
          <p className="text-xs text-[var(--text-secondary)] mt-3">
            Running encrypted analysis on Arcium
          </p>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-secondary)]">
              Overall progress
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {overallPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--button-primary)] transition-[width] duration-300 ease-out"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* All Stages - Always Visible */}
      <div className="space-y-3 mb-6">
        {STAGES.map((stage, index) => {
          const state = getStageState(index);

          return (
            <div key={index} className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center">
                {state === "blinking" || state === "current" ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--button-primary)] flex items-center justify-center animate-pulse">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                ) : state === "done" ? (
                  <Image
                    src={stage.iconDone}
                    alt="steps_icons"
                    width={30}
                    height={30}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Image
                      src={stage.iconPending}
                      alt=""
                      width={30}
                      height={30}
                    />
                  </div>
                )}
              </div>

              {/* Stage Title */}
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    state === "pending"
                      ? "text-[var(--text-secondary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {stage.title}
                </span>
              </div>

              {/* Done Label */}
              {state === "done" && (
                <span className="text-xs text-green-600 font-medium">Done</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Details Card - Only Current Subtitle */}
      {phase === "analyzing" && stageIdx > 0 && stageIdx < STAGES.length && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--button-primary)]/10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src={"/icons/GraphIconGrey.svg"}
              alt=""
              width={30}
              height={30}
              // className="w-5 h-5"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {STAGES[stageIdx].title}
              </span>
              {STAGES[stageIdx].weight && (
                <span className="text-xs text-[var(--text-secondary)] ml-2">
                  (weightage: {STAGES[stageIdx].weight})
                </span>
              )}
            </div>
          </div>

          {/* Only show current subtitle with enhanced fade */}
          {visibleSubs > 0 && STAGES[stageIdx].subtitles[visibleSubs - 1] && (
            <div
              key={visibleSubs}
              className="text-sm text-[var(--text-secondary)] pl-5 relative animate-slowFadeIn min-h-[24px]"
            >
              <span className="absolute left-0 top-[9px] w-1.5 h-1.5 rounded-full bg-[var(--button-primary)]" />
              {STAGES[stageIdx].subtitles[visibleSubs - 1]}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slowFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slowFadeIn {
          animation: slowFadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
