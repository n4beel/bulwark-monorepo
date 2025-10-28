"use client";

import { getSeverityColor } from "@/utils";
import Image from "next/image";

type SeverityCounts = {
  high?: number;
  medium?: number;
  low?: number;
};

type Props = {
  findings?: {
    totalFindings?: number;
    severityCounts?: SeverityCounts;
  };
};

function HotspotRow({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: "low" | "medium" | "high";
}) {
  const colorClass = getSeverityColor(severity);

  return (
    <div className="flex justify-between items-center mt-2">
      {/* label stays neutral */}
      <span className="text-[var(--text-secondary)]">{label}</span>

      {/* color only on count */}
      <span
        className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}
      >
        {count}
      </span>
    </div>
  );
}

export default function HotspotsCard({
  findings = {
    totalFindings: 0,
    severityCounts: { high: 0, medium: 0, low: 0 },
  },
}: Props) {
  const total = findings.totalFindings ?? 0;
  const sc = findings.severityCounts ?? {};

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 text-sm w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <span className="flex items-center  text-[var(--text-primary)] font-medium">
          <Image
            src={"/icons/AnalyzerBrain.svg"}
            alt="analyzerBrain"
            width={25}
            height={25}
            className="mr-1"
          />{" "}
          Hotspots
        </span>
        <span className="text-xs text-[var(--text-secondary)]">
          {total} total
        </span>
      </div>

      <HotspotRow
        label="High-risk hotspots"
        count={sc.high ?? 0}
        severity="high"
      />
      <HotspotRow
        label="Medium-risk issues"
        count={sc.medium ?? 0}
        severity="medium"
      />
      <HotspotRow
        label="Low-priority items"
        count={sc.low ?? 0}
        severity="low"
      />
    </div>
  );
}
