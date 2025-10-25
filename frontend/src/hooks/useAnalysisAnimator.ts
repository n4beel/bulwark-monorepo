"use client";

import { useEffect, useMemo, useState } from "react";

export type Phase = "parsing" | "analyzing";
export interface Stage {
  title: string;
  weight: string;
  subtitles: string[];
  iconPending: string;
  iconDone: string;
}

interface Options {
  apiReady?: boolean;
  perSubtitleMs?: number; // default 300
  interStagePauseMs?: number; // default 500
  finishDelayMs?: number; // default 500
}

export function useAnalysisAnimator(
  stages: Stage[],
  opts: Options,
  onDone?: () => void
) {
  const {
    apiReady = false,
    perSubtitleMs = 300,
    interStagePauseMs = 500,
    finishDelayMs = 500,
  } = opts;

  const [phase, setPhase] = useState<Phase>("parsing");
  const [stageIdx, setStageIdx] = useState(0);
  const [visibleSubs, setVisibleSubs] = useState(0);

  // move into analyzing when API is ready
  useEffect(() => {
    if (apiReady && phase === "parsing") {
      setPhase("analyzing");
      setStageIdx(1); // Skip parsing stage (index 0), move to first real stage
    }
  }, [apiReady, phase]);

  // drive subtitle / stage progression during analyzing
  useEffect(() => {
    if (phase !== "analyzing") return;
    const current = stages[stageIdx];
    if (!current) return;

    if (visibleSubs < current.subtitles.length) {
      const t = setTimeout(() => setVisibleSubs((v) => v + 1), perSubtitleMs);
      return () => clearTimeout(t);
    }

    // stage finished – move on or finish all
    if (stageIdx < stages.length - 1) {
      const t = setTimeout(() => {
        setStageIdx((i) => i + 1);
        setVisibleSubs(0);
      }, interStagePauseMs);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => onDone?.(), finishDelayMs);
      return () => clearTimeout(t);
    }
  }, [
    phase,
    stageIdx,
    visibleSubs,
    stages,
    perSubtitleMs,
    interStagePauseMs,
    finishDelayMs,
    onDone,
  ]);

  // simple linear overall progress (parsing = 0 → 10%; analyzing animates to 100%)
  const overallPct = useMemo(() => {
    if (phase === "parsing") return 10;
    const totalItems = stages.reduce((s, st) => s + st.subtitles.length, 0);
    const doneItems =
      stages.slice(0, stageIdx).reduce((s, st) => s + st.subtitles.length, 0) +
      visibleSubs;
    const pct = 10 + Math.round((doneItems / Math.max(1, totalItems)) * 90);
    return Math.min(100, Math.max(10, pct));
  }, [phase, stageIdx, visibleSubs, stages]);

  return { phase, stageIdx, visibleSubs, overallPct };
}
