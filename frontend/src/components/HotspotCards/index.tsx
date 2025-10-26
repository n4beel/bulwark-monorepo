"use client";

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
  tone,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "info";
}) {
  const colors =
    tone === "danger"
      ? { bg: "var(--red-light)", color: "var(--red-medium)" }
      : tone === "warning"
      ? { bg: "var(--orange-light)", color: "var(--orange-medium)" }
      : { bg: "var(--blue-light)", color: "var(--blue-primary)" };

  return (
    <div className="flex justify-between items-center mt-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className="px-2 py-1 rounded-md text-xs font-medium"
        style={{ background: colors.bg, color: colors.color }}
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
    <div className=" rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 text-sm w-full h-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[var(--text-primary)]">Hotspots</span>
        <span className="text-xs text-[var(--text-secondary)]">
          {total} total
        </span>
      </div>

      <HotspotRow
        label="High-risk hotspots"
        count={sc.high ?? 0}
        tone="danger"
      />
      <HotspotRow
        label="Medium-risk issues"
        count={sc.medium ?? 0}
        tone="warning"
      />
      <HotspotRow label="Low-priority items" count={sc.low ?? 0} tone="info" />
    </div>
  );
}
