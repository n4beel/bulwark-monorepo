"use client";

import Image from "next/image";
import Tooltip from "../ui/ToolTip";

type Estimate = {
  days?: [number, number]; // p50 – p90 window
  devs?: [number, number]; // people range
  cost?: number; // USD cost estimate
  variance?: number; // %
};

type Props = {
  estimate?: Estimate;
};

export default function AuditEffortCard({
  estimate = {
    days: [12, 19],
    devs: [1, 2],
    cost: 18000,
    variance: 20,
  },
}: Props) {
  const daysText = estimate.days?.join("–") ?? "12–19";
  const devsText = estimate.devs?.join("–") ?? "1–2";
  const costText = Intl.NumberFormat().format(estimate.cost ?? 18000);
  const varianceText = estimate.variance ?? 20;

  return (
    <div className="col-span-2 p-3 rounded-lg border border-[var(--border-color)] relative w-full h-full">
      {/* Header */}
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span>Audit Effort Units (time/resources/cost)</span>
        <Tooltip text="Calculated from similar code reviews with average developer velocity.">
          <Image
            src="/icons/InfoIcon.svg"
            alt="i"
            width={14}
            height={14}
            className="cursor-pointer"
          />
        </Tooltip>
      </div>

      {/* Three sections */}
      <div className="flex justify-between text-center mt-2">
        {/* Days */}
        <div className="flex-1">
          <Image
            src="/icons/Clock.svg"
            alt="time"
            width={18}
            height={18}
            className="mx-auto mb-1"
          />
          <p className="font-semibold">{daysText}d</p>
          <p className="text-[10px] text-[var(--text-secondary)]">p50 to p90</p>
        </div>

        {/* Divider */}
        <div className="w-px bg-[var(--border-color)] mx-3" />

        {/* Devs */}
        <div className="flex-1">
          <Image
            src="/icons/Peoples.svg"
            alt="team"
            width={18}
            height={18}
            className="mx-auto mb-1"
          />
          <p className="font-semibold">{devsText}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">p50 to p90</p>
        </div>

        {/* Divider */}
        <div className="w-px bg-[var(--border-color)] mx-3" />

        {/* Cost */}
        <div className="flex-1">
          <Image
            src="/icons/CurrencyCircleDollar.svg"
            alt="cost"
            width={18}
            height={18}
            className="mx-auto mb-1"
          />
          <p className="font-semibold">${costText}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">
            ±{varianceText}% variance
          </p>
        </div>
      </div>
    </div>
  );
}
