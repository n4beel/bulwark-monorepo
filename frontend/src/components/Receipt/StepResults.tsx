"use client";

import Image from "next/image";
import Tooltip from "../ui/ToolTip";
import Chip from "../ui/Chip";
import ComplexityCard from "../ComplexityCard";
import AuditEffortCard from "../AuditEffortCard";
import HotspotsCard from "../HotspotCards";

export default function StepResults({ report }: any) {
  const complexityScore =
    Number(report?.scores?.structural?.score) ||
    Number(report?.complexityScore) ||
    0;

  // Determine if this is GitHub or Upload source
  const isGitHubSource = !!report?.repository?.includes("/");
  const sourceLabel = isGitHubSource
    ? `GitHub: ${report.repository}`
    : "Uploaded Archive";

  return (
    <div
      className="relative px-8 pt-6 pb-0 min-h-[520px] flex flex-col"
      style={{
        backgroundImage:
          "radial-gradient(var(--border-color) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      {/* Top Chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Chip
          label="Encrypted by Arcium"
          iconSrc="/icons/arcium.svg"
          iconAlt="Arcium"
          iconSide="right"
          variant="filled"
          size="sm"
        />
        {report?.language && (
          <Chip label={report.language} variant="outline" size="sm" />
        )}
        {report?.framework && (
          <Chip label={report.framework} variant="outline" size="sm" />
        )}
      </div>

      {/* Success Section */}
      <div className="mt-2 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--green-light)] flex items-center justify-center">
          <Image
            src="/icons/GreenCheck.svg"
            alt="done"
            width={28}
            height={28}
          />
        </div>
        <h2 className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">
          Scan complete!
        </h2>

        <p className="mt-2 text-xs text-[var(--text-secondary)] max-w-[560px] flex items-start gap-1.5 justify-center">
          <Image
            src="/icons/InfoIcon.svg"
            alt="info"
            width={14}
            height={14}
            className="flex-shrink-0 mt-0.5"
          />
          <span>
            Disclaimer: The results of this scan are bound to the commit of the
            codebase shared. These results are presented with a scope confidence
            of ~60% or more, based on the current Bulwark Scoping Framework™.
          </span>
        </p>
      </div>

      {/* Divider */}
      <div className="my-4 w-full border-t-2 border-dashed border-[var(--border-color)]" />

      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-primary)] font-medium">
            {sourceLabel}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {report?.scanMetadata?.scannedFiles || 0} files •{" "}
            {report?.scanMetadata?.sizeKB || 0} KB
          </p>
        </div>

        <div className="text-end text-[10px] text-[var(--text-secondary)]">
          {report?.createdAt && (
            <p>
              Analyzed:{" "}
              <span className="underline cursor-default">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </p>
          )}
          <p>
            Receipt ID:{" "}
            <span className="underline cursor-default">
              {report?.receiptId ?? "A54D7S846"}
            </span>
          </p>
          {report?.commitHash && (
            <p>
              Commit:{" "}
              <span className="underline cursor-default">
                {report.commitHash.slice(0, 7)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex flex-row gap-1 mt-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
        {/* Complexity Card */}
        <div className="w-[40%]">
          <ComplexityCard
            complexityScore={Number(report?.scores?.total) || 0}
          />
        </div>

        {/* Audit Effort Units */}

        <AuditEffortCard
          estimate={{
            days: [
              report?.result?.auditEffort?.timeRange?.minimumDays ?? 0,
              report?.result?.auditEffort?.timeRange?.maximumDays ?? 0,
            ],
            devs: [
              report?.result?.auditEffort?.resourceRange?.minimumCount ?? 0,
              report?.result?.auditEffort?.resourceRange?.maximumCount ?? 0,
            ],
            cost: report?.result?.auditEffort?.totalCost ?? 0,
            variance: 20, // or calculate dynamically if you have that info
          }}
        />
      </div>

      {/* Hotspots - Use real data if available */}
      <HotspotsCard
        findings={{
          totalFindings: report?.result?.hotspots?.totalCount || 0,
          severityCounts: {
            high: report?.result?.hotspots?.highRiskCount || 0,
            medium: report?.result?.hotspots?.mediumRiskCount || 0,
            low: report?.result?.hotspots?.lowPriorityCount || 0,
          },
        }}
      />

      <Image
        src="/icons/Wave.svg"
        alt="wave"
        width={1200}
        height={20}
        className="w-full h-5 mt-4"
      />
    </div>
  );
}
