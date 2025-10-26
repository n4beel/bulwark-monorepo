"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Tooltip from "../ui/ToolTip";
import Chip from "../ui/Chip";

export default function StepResults({ report }: any) {
  const router = useRouter();

  const complexityScore =
    Number(report?.scores?.structural?.score) ||
    Number(report?.complexityScore) ||
    67;

  // Dynamic complexity bar percentage split by risk zone
  const greenPct = Math.min(complexityScore, 40);
  const orangePct = Math.min(Math.max(complexityScore - 40, 0), 30);
  const redPct = Math.max(complexityScore - 70, 0);

  return (
    <div
      className="relative px-8 pt-6 pb-0 min-h-[520px] flex flex-col"
      style={{
        backgroundImage:
          "radial-gradient(var(--border-color) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      {/* Encrypted Ribbon */}

      <div className="w-fit">
        <Chip
          label="Encrypted by Arcium"
          iconSrc="/icons/arcium.svg"
          iconAlt="Arcium"
          iconSide="right"
          variant="filled"
          size="sm"
        />
      </div>

      {/* Success Section */}
      <div className="mt-4 flex flex-col items-center text-center">
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

        {/* Disclaimer */}
        {/* Disclaimer with Info Icon */}
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
        <p className="text-sm text-[var(--text-primary)]">
          Here’s what we found about your Solana Program:
        </p>

        <div className="text-end text-[10px] text-[var(--text-secondary)]">
          <p>
            Receipt ID:{" "}
            <span className="underline cursor-default">
              {report?.receiptId ?? "A54D7S846"}
            </span>
          </p>
          <p>
            Bound to commit:{" "}
            <span className="underline cursor-default">
              {(report?.commitHash ?? "108571abcdef").slice(0, 7)}
            </span>
          </p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-3 mt-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)]">
        {/* Complexity Card */}
        <div className="rounded-lg p-3 border border-[var(--blue-primary)] bg-[#E8F0FF] relative bg-red">
          {/* Tooltip */}
          <div className="flex flex-row items-center justify-between gap-1">
            <p className="text-[11px] text-[var(--blue-primary)] font-medium">
              Complexity Score
            </p>

            <Tooltip text="A 0–100 composite across Structural (20), Security (30), Systemic (20), Economic & Logical (30).">
              <Image
                src="/icons/InfoIcon.svg"
                alt="i"
                width={14}
                height={14}
                // className="absolute top-20 right-2 cursor-pointer"
              />
            </Tooltip>
          </div>

          <div className="mt-2 flex items-end gap-1">
            <span className="text-[28px] font-bold text-[var(--text-primary)]">
              {complexityScore}
            </span>
            <span className="text-xs text-[var(--text-secondary)] pb-1">
              /100
            </span>
          </div>

          {/* Dynamic Multicolor Bar */}
          <div className="mt-3 flex w-full rounded-full overflow-hidden border border-[var(--border-color)] h-2 bg-white">
            <div
              style={{
                width: `${greenPct}%`,
                background: "var(--green-medium)",
              }}
            />
            <div
              style={{
                width: `${orangePct}%`,
                background: "var(--orange-medium)",
              }}
            />
            <div
              style={{ width: `${redPct}%`, background: "var(--red-medium)" }}
            />
          </div>
        </div>

        {/* Audit Effort Units */}
        <div className="col-span-2 p-3 rounded-lg border border-[var(--border-color)] relative">
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>Audit Effort Units (time/resources/cost)</span>

            <Tooltip text="Calculated based on similar code review examples with typical developer velocity range.">
              <Image
                src="/icons/InfoIcon.svg"
                alt="i"
                width={14}
                height={14}
                className="cursor-pointer"
              />
            </Tooltip>
          </div>

          <div className="flex justify-between text-center mt-2">
            {/* Days */}
            <div className="flex-1">
              <Image
                src="/icons/Clock.svg"
                alt=""
                width={18}
                height={18}
                className="mx-auto mb-1"
              />
              <p className="font-semibold">
                {report?.estimate?.days?.join("–") ?? "12–19"}d
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                p50 to p90
              </p>
            </div>

            {/* Divider */}
            <div className="w-px bg-[var(--border-color)] mx-3" />

            {/* Devs */}
            <div className="flex-1">
              <Image
                src="/icons/Peoples.svg"
                alt=""
                width={18}
                height={18}
                className="mx-auto mb-1"
              />
              <p className="font-semibold">
                {report?.estimate?.devs?.join("–") ?? "1–2"}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                p50 to p90
              </p>
            </div>

            <div className="w-px bg-[var(--border-color)] mx-3" />

            {/* Cost */}
            <div className="flex-1">
              <Image
                src="/icons/CurrencyCircleDollar.svg"
                alt=""
                width={18}
                height={18}
                className="mx-auto mb-1"
              />
              <p className="font-semibold">
                ${Intl.NumberFormat().format(report?.estimate?.cost ?? 18000)}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                ±{report?.estimate?.variance ?? 20}% variance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots */}
      <div className="mt-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[var(--text-primary)]">Hotspots</span>
        </div>

        <HotspotRow label="High-risk hotspots" count={3} tone="danger" />
        <HotspotRow label="Medium-risk issues" count={7} tone="warning" />
        <HotspotRow label="Recommendations" count={2} tone="info" />
      </div>

      {/* Footer Buttons */}

      {/* Wave */}
      <Image
        src="/icons/Wave.svg"
        alt="wave"
        width={1200}
        height={20}
        className="w-full h-5"
      />
    </div>
  );
}

// =====================================================
// Hotspot pill row
// =====================================================
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
        className="px-2 py-1 rounded-md text-xs"
        style={{ background: colors.bg, color: colors.color }}
      >
        {count}
      </span>
    </div>
  );
}
