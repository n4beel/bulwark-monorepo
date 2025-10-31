"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type ChipProps = {
  label: string;
  iconSrc?: string;
  iconAlt?: string;
  iconSide?: "left" | "right";
  variant?: "outline" | "filled";
  size?: "sm" | "md";
  href?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string; // optional extra sizing
};

export default function Chip({
  label,
  iconSrc,
  iconAlt = "",
  iconSide = "right",
  variant = "outline",
  size = "sm",
  href,
  onClick,
  className,
  iconClassName,
}: ChipProps) {
  const base =
    "inline-flex items-center rounded-full border transition-colors select-none";
  const paddings = size === "md" ? "px-3 py-2 gap-2" : "px-3 py-1 gap-1.5";
  const text = size === "md" ? "text-xs" : "text-[11px]";

  const palette =
    variant === "filled"
      ? "bg-[var(--card-accent)] border-[var(--blue-secondary)]/30 text-[var(--text-primary)]"
      : "bg-[var(--background)] border-[var(--border-color)] text-[var(--text-primary)]";

  // CSS sizing for icons (CSS beats width/height attributes)
  const iconSizeCls = size === "md" ? "h-5 w-auto" : "h-4 w-auto"; // grow by changing h-*

  const Icon = iconSrc ? (
    <Image
      src={iconSrc}
      alt={iconAlt}
      width={64} // arbitrary; CSS below controls the visual size
      height={24}
      className={clsx("shrink-0", iconSizeCls, iconClassName)}
    />
  ) : null;

  const content = (
    <span className={clsx(base, paddings, text, palette, className)}>
      {iconSide === "left" && Icon}
      <span className="whitespace-nowrap">{label}</span>
      {iconSide === "right" && Icon}
    </span>
  );

  return href ? (
    <Link href={href} aria-label={label} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick}>
      {content}
    </button>
  );
}
