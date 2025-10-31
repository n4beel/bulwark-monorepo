"use client";

import Image from "next/image";
import Tooltip from "../ui/ToolTip";
import { AuditEffort } from "@/types/api";

type Props = { estimate?: AuditEffort };

const fmt = (n?: number | null, suffix: string = "") =>
  n == null || isNaN(n) ? `0${suffix}` : `${n}${suffix}`;

export default function AuditEffortCard({ estimate }: Props) {
  const lower = estimate?.lowerAuditEffort;
  const upper = estimate?.upperAuditEffort;

  return (
    <div className="relative rounded-xl border border-[var(--blue-primary)] bg-white py-2">
      <div className="absolute inset-0 bg-[url('/images/DotPattern.svg')] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between text-xs mb-3 px-3">
        <div className="text-[var(--text-secondary)] font-normal text-sm">
          Audit Effort Units{" "}
          <span className="text-[10px]">(time/resources/cost)</span>
        </div>

        <Tooltip text="Calibration based on similar code we've seen & stability.">
          <Image
            src="/icons/InfoIcon.svg"
            width={14}
            height={14}
            alt="info"
            className="cursor-pointer"
          />
        </Tooltip>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-hidden">
        {/* Header Icons Row */}
        <div className="grid grid-cols-3 py-2  bg-[var(--gray-light)]/30 text-[11px] text-[var(--text-secondary)] px-3">
          {/* <span></span> */}
          <Image src="/icons/Clock.svg" width={14} height={14} alt="time" />
          <Image src="/icons/Peoples.svg" width={14} height={14} alt="team" />
          <Image
            src="/icons/CurrencyCircleDollar.svg"
            width={14}
            height={14}
            alt="cost"
          />
        </div>

        {/* Standard Row */}
        <div className="grid grid-cols-3  border-t border-[var(--border-color)] px-3 items-center">
          {/* <Image src="/icons/Cube.svg" width={50} height={40} alt="" /> */}
          <p className="font-medium">
            {fmt(lower?.timeRange?.minimumDays)}–
            {fmt(lower?.timeRange?.maximumDays, "d")}
          </p>
          <p className="font-medium">{fmt(lower?.resources)}</p>
          <p className="font-medium">
            ${fmt(lower?.costRange?.minimumCost, "K")}–
            {fmt(lower?.costRange?.maximumCost, "K")}
          </p>
        </div>

        {/* Forensic Row */}
        <div className="grid grid-cols-3 border-t border-[var(--border-color)] px-3 items-center">
          {/* <Image src="/icons/BgDiamond.svg" width={50} height={40} alt="" /> */}
          <p className="font-medium">
            {fmt(upper?.timeRange?.minimumDays)}–
            {fmt(upper?.timeRange?.maximumDays, "d")}
          </p>
          <p className="font-medium">{fmt(upper?.resources)}</p>
          <p className="font-medium">
            ${fmt(upper?.costRange?.minimumCost, "K")}–
            {fmt(upper?.costRange?.maximumCost, "K")}
          </p>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-3 text-[10px] text-[var(--text-secondary)] border-t border-[var(--border-color)] py-2 px-3">
          {/* <span></span> */}
          <span>p50 to p80</span>
          <span>p50 to p80</span>
          <span>±20% variance</span>
        </div>
      </div>
    </div>
  );
}
