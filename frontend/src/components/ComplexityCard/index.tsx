"use client";

import Image from "next/image";
import Tooltip from "../ui/ToolTip";

type Props = {
  complexityScore: number; // 0–100
  thresholds?: {
    green: number;
    orange: number;
    red: number;
  };
};

export default function ComplexityCard({
  complexityScore,
  thresholds = {
    green: 40,
    orange: 70,
    red: 100,
  },
}: Props) {
  // Ensure score stays within 0–100
  const score = Math.min(Math.max(complexityScore, 0), 100);

  const greenPct = Math.min(score, thresholds.green);
  const orangePct =
    score > thresholds.green
      ? Math.min(score, thresholds.orange) - thresholds.green
      : 0;
  const redPct =
    score > thresholds.orange
      ? Math.min(score, thresholds.red) - thresholds.orange
      : 0;

  return (
    <div className="rounded-lg p-3 border border-[var(--blue-primary)] bg-[var(--blue-primary)] relative w-full h-full">
      <div className="flex flex-row items-center justify-between gap-1">
        <p className="text-md  text-[var(--white)] font-normal">
          Complexity Score
        </p>

        <Tooltip text="A 0–100 composite across Structural (20), Security (30), Systemic (20), Economic & Logical (30).">
          <Image
            src="/icons/InfoIconWhite.svg"
            alt="i"
            width={14}
            height={14}
          />
        </Tooltip>
      </div>

      <div className="mt-2 flex items-end gap-1">
        <span className="text-[28px] font-normal opacity-90 text-[var(--white)]">
          {score?.toFixed(2)}
        </span>
        <span className="text-sm font-normal text-[var(--white)]  opacity-60 pb-1">
          /100
        </span>
      </div>

      <div className="mt-3 flex w-full rounded-full overflow-hidden border border-[var(--border-color)] h-2 bg-white">
        {greenPct > 0 && (
          <div
            className="h-full"
            style={{
              width: `${(greenPct / 100) * 100}%`,
              background: "var(--green-medium)",
            }}
          />
        )}
        {orangePct > 0 && (
          <div
            className="h-full"
            style={{
              width: `${(orangePct / 100) * 100}%`,
              background: "var(--orange-medium)",
            }}
          />
        )}
        {redPct > 0 && (
          <div
            className="h-full"
            style={{
              width: `${(redPct / 100) * 100}%`,
              background: "var(--red-medium)",
            }}
          />
        )}
      </div>
    </div>
  );
}
