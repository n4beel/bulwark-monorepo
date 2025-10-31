"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Stage = {
  key: "parsing" | "structural" | "security" | "systemic" | "economic";
  title: string;
  heading: string;
  weight?: string;
  iconPending: string;
  iconDone: string;
  subtitles: string[];
};

interface Props {
  onComplete?: () => void;
  apiReady?: boolean; // ← this is the only gate we use for finishing parsing
}

/** Timing controls (increase numbers ⇒ slower) */
const DELAY = {
  minParsingMs: 2000, // small minimum to avoid flicker (set 0 if not needed)
  subtitle: 2000, // per-subtitle tick
  rotate: 2000, // focus-card rotation speed
};

const STAGES: Stage[] = [
  {
    key: "parsing",
    title: "Parsing rust files",
    heading: "Parsing rust files",
    iconPending: "/icons/TickMark.svg",
    iconDone: "/icons/TickMark.svg",
    subtitles: [],
  },
  {
    key: "structural",
    title: "Structural Complexity",
    heading: "Computing complexity scores",
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
    key: "security",
    title: "Security Analysis Complexity",
    heading: "Detecting security vulnerability hotspots",
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
    key: "systemic",
    title: "Systemic Analysis",
    heading: "Calculating Audit Effort Units (AEU) ",
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
    key: "economic",
    title: "Economic & Logical Complexity",
    heading: "Issuing commit-bound receipt via Arcium",
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function StepAnalysisProgress({
  onComplete,
  apiReady = false,
}: Props) {
  // per-stage subtitle index (0..len)
  const [subIdx, setSubIdx] = useState<number[]>(() => STAGES.map(() => 0));
  const [done, setDone] = useState<boolean[]>(() => STAGES.map(() => false));

  // UI phase & rotation for bottom focus card
  const [phase, setPhase] = useState<"parsing" | "parallel" | "done">(
    "parsing"
  );
  const [focusIdx, setFocusIdx] = useState<number>(1); // cycles 1..4 (structural..economic)
  const rotTimerRef = useRef<number | null>(null);
  const parsingStartMs = useRef<number>(Date.now());

  /** overall percent (simple heuristic) */
  const overallPct = useMemo(() => {
    const totals = STAGES.map((s) => s.subtitles.length);
    const doneSubs = subIdx.reduce(
      (acc, val, i) => acc + Math.min(val, totals[i] ?? 0),
      0
    );
    const totalSubs = totals.reduce((a, b) => a + b, 0);
    const parsingChunk = 1;
    const denom = totalSubs + parsingChunk;
    const numer = done[0] ? doneSubs + parsingChunk : doneSubs;
    return Math.min(100, Math.round((numer / Math.max(denom, 1)) * 100));
  }, [subIdx, done]);

  /** 1) Stay in PARSING until apiReady becomes true (with optional minimum time) */
  useEffect(() => {
    let cancelled = false;

    const finishParsingIfReady = async () => {
      if (!apiReady || done[0]) return;
      const elapsed = Date.now() - parsingStartMs.current;
      const waitMore = Math.max(0, DELAY.minParsingMs - elapsed);
      if (waitMore > 0) await sleep(waitMore);
      if (cancelled) return;

      // mark parsing done
      setDone((d) => {
        const next = [...d];
        next[0] = true;
        return next;
      });

      // move to parallel
      setPhase("parallel");

      // start rotating focus across 1..4
      rotTimerRef.current = window.setInterval(() => {
        setFocusIdx((i) => (i >= 4 ? 1 : i + 1));
      }, DELAY.rotate) as unknown as number;

      // helper: advance subtitles in a stage
      const advance = async (i: number) => {
        const total = STAGES[i].subtitles.length;
        for (let s = 1; s <= total; s++) {
          if (cancelled) return;
          setSubIdx((arr) => {
            const next = [...arr];
            next[i] = s;
            return next;
          });
          await sleep(DELAY.subtitle);
        }
        if (cancelled) return;
        setDone((d) => {
          const next = [...d];
          next[i] = true;
          return next;
        });
      };

      // run structural, security, systemic, economic in parallel
      await Promise.all([advance(1), advance(2), advance(3), advance(4)]);

      if (rotTimerRef.current) {
        window.clearInterval(rotTimerRef.current);
        rotTimerRef.current = null;
      }
      if (cancelled) return;

      setPhase("done");
      onComplete?.();
    };

    finishParsingIfReady();

    return () => {
      cancelled = true;
      if (rotTimerRef.current) {
        window.clearInterval(rotTimerRef.current);
        rotTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady]); // ← only reacts to apiReady flipping true

  /** helpers for list UI */
  const stageState = (i: number) => {
    if (i === 0) return !done[0] ? "blinking" : "done";
    if (done[i]) return "done";
    if (phase === "parallel" && subIdx[i] > 0) return "current";
    return "pending";
  };

  /** rotating focus card shows among 1..4 */
  const focusStageIndex = focusIdx; // 1..4
  const focusStage = STAGES[focusStageIndex];
  const focusSubIdx = subIdx[focusStageIndex];
  const currentSubtitle = focusStage.subtitles[focusSubIdx - 1];

  return (
    <div className="px-8 pt-4 pb-8 min-h-[520px] flex flex-col">
      {/* Top banner */}
      <div className="rounded-2xl   p-6 mb-6">
        <div className="flex flex-col items-center">
          <p className="text-2xl font-normal text-[var(--text-primary)] mb-2">
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
            Most scans finish in under 2 minutes.
          </p>
        </div>

        {/* Overall Progress */}
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

      {/* Stages list */}
      <div className="space-y-3 mb-4">
        {STAGES.map((stage, i) => {
          const state = stageState(i);
          return (
            <div key={stage.key} className="flex items-center gap-3">
              {/* icon */}
              <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center">
                {state === "blinking" || state === "current" ? (
                  <div className="w-8 h-8 rounded-full bg-[var(--button-primary)] flex items-center justify-center animate-pulse">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                ) : state === "done" ? (
                  <Image src={stage.iconDone} alt="" width={30} height={30} />
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

              {/* title */}
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    state === "pending"
                      ? "text-[var(--text-secondary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {stage.heading}
                  {stage.weight && (
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                      (weightage: {stage.weight})
                    </span>
                  )}
                </span>
              </div>

              {/* done chip */}
              {state === "done" && (
                <span className="text-xs text-green-600 font-medium">Done</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Focus card (rotates during parallel) */}
      {focusStage && phase !== "done" && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--button-primary)]/10 px-2 py-2">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src={
                focusStage.key === "security"
                  ? "/icons/ShieldIconGrey.svg"
                  : focusStage.key === "systemic"
                  ? "/icons/GraphIconGrey.svg"
                  : focusStage.key === "economic"
                  ? "/icons/DocumentIconGrey.svg"
                  : "/icons/TickMark.svg"
              }
              alt=""
              width={28}
              height={28}
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {focusStage.title}
              </span>
              {focusStage.weight && (
                <span className="text-xs text-[var(--text-secondary)] ml-2">
                  (weightage: {focusStage.weight})
                </span>
              )}
            </div>
          </div>

          {/* subtitle with fade-in (force remount on change) */}
          {currentSubtitle && (
            <div
              key={`${focusStage.key}-${focusSubIdx}`}
              className="text-sm text-[var(--text-secondary)] pl-5 ml-5 relative animate-slowFadeIn min-h-[24px]"
            >
              <span className="absolute left-0 top-[9px] w-1.5 h-1.5 rounded-full bg-[var(--button-primary)]" />
              {currentSubtitle}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slowFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slowFadeIn {
          animation: slowFadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
