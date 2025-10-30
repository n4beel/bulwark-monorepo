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
    <div className="w-full flex flex-col justify-center items-center pb-16 pt-8 mt-2">
      <h1
        className="text-3xl font-normal my-12"
        style={{
          fontFamily: '"Doto", sans-serif',
          color: "var(--black-primary)",
        }}
      >
        Why Bulwark is different ?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl p-6 min-h-[240px] transition-all shadow-sm border flex flex-col justify-between
              ${
                item.highlighted
                  ? "bg-[#0057ff] text-white shadow-xl scale-[1.03]"
                  : "bg-white text-gray-900 border-gray-200 hover:shadow-lg"
              }`}
          >
            {/* Title — left aligned, dotted font */}
            <div className="flex flex-row justify-between items-center">
              <h3
                className="mt-4 font-normal text-lg uppercase tracking-normal mb-6 max-w-2/3"
                style={{
                  fontFamily: "'Doto', sans-serif",
                  letterSpacing: "3px",
                }}
              >
                {item.title}
              </h3>
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
            </div>

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
