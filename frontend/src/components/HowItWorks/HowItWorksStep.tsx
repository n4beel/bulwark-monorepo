"use client";
import Image from "next/image";

export interface HowStepItem {
  step: string;
  title: string;
  description: string;
  icon: string;
  image: string;
}

interface Props {
  step: HowStepItem;
  reversed?: boolean;
}

export default function HowStepContainer({ step, reversed }: Props) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.06)] px-10 py-8 w-full
     flex flex-col md:flex-row items-center justify-between gap-12 mt-4 h-150
      ${reversed ? "md:flex-row-reverse" : ""}
    `}
    >
      {/* LEFT CONTENT */}
      <div className="md:w-[30%] w-full h-11/12  flex flex-col items-start ">
        {/* Step Badge */}
        <span className="text-xs px-3 py-1 rounded-full bg-[#E8F0FF] text-[var(--black-primary)] font-normal">
          STEP {step.step}
        </span>

        {/* Step Icon */}
        <div className="mt-4">
          <Image src={step.icon} width={143} height={135} alt="step" />
        </div>

        {/*  Heading */}
        <h3 className="mt-4 text-3xl font-normal tracking-normal text-[var(--blue-deep)]">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--black)] leading-relaxed mt-20">
          {step.description}
        </p>
      </div>

      {/* RIGHT IMAGE */}
      <div className="md:w-[70%] w-full ">
        <Image
          src={step.image}
          alt="preview"
          width={900}
          height={500}
          className="rounded-2xl w-full"
        />
      </div>
    </div>
  );
}
