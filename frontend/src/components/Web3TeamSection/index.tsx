"use client";
import Image from "next/image";

export interface Web3TeamItem {
  title: string;
  description: string;
  icon: string; // SVG path or imported static asset
}

interface Props {
  title: string;
  subtitle: string;
  items: Web3TeamItem[];
}

export default function Web3TeamsSection({ title, subtitle, items }: Props) {
  return (
    <section className="w-full max-w-7xl mx-auto py-20 px-4 mt-20">
      {/* Top Heading */}
      <h2
        className="text-center text-3xl md:text-4xl tracking-widest mb-2 font-semibold"
        style={{
          fontFamily: "'Doto', sans-serif",
          //   color: "var(--blue-primary)",
        }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      <p className="text-center text-sm md:text-base text-[var(--text-secondary)] mb-14">
        {subtitle}
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-[var(--border-color)] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            {/* Icon */}
            <Image
              src={item.icon}
              alt={item.title}
              width={38}
              height={38}
              className="mb-4"
            />

            {/* Card Title */}
            <h3 className="text-lg font-extrabold text-[var(--black)] mb-2 doto">
              {item.title}
            </h3>

            {/* Card Description */}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
