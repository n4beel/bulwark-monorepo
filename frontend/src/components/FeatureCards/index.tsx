"use client";
import Image from "next/image";

export interface FeatureCardItem {
  title: string;
  description: string;
  icon: string;
  highlighted?: boolean;
}

interface Props {
  items: FeatureCardItem[];
}

export default function FeatureCards({ items }: Props) {
  return (
    <div className="w-full flex justify-center py-16 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl p-6 min-h-[240px] transition-all shadow-sm border
              ${
                item.highlighted
                  ? "bg-[#0057ff] text-white shadow-xl scale-[1.03]"
                  : "bg-white text-gray-900 border-gray-200 hover:shadow-lg"
              }`}
          >
            {/* Icon bubble */}
            <div
              className="  w-14 h-14 bg-white shadow-md rounded-full border border-gray-100
              flex items-center justify-center"
            >
              <Image
                src={item.icon}
                alt={item.title}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>

            {/* Title — left aligned, dotted font */}
            <h3
              className="mt-4 font-bold text-lg uppercase tracking-widest mb-6"
              style={{
                fontFamily: "'Doto', sans-serif",
                letterSpacing: "3px",
              }}
            >
              {item.title}
            </h3>

            {/* Description — left aligned */}
            <p
              className={`mt-3 text-sm leading-relaxed pr-2
                ${item.highlighted ? "opacity-95" : "text-gray-600 opacity-80"}
              `}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
