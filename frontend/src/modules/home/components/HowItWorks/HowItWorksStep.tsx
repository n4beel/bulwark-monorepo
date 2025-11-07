'use client';

import Image from 'next/image';

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
    <div className="relative w-full rounded-3xl overflow-hidden border border-[var(--card-accent)]">
      <div className="absolute inset-0 z-10">
        <Image
          src="/images/How-step-bg.png"
          alt="background"
          fill
          className="object-center object-none"
          priority
        />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 w-full px-8 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-12 mt-4 ${reversed ? 'md:flex-row-reverse' : ''}`}
      >
        {/* LEFT */}
        <div className="md:w-[30%] w-full flex flex-col items-start">
          <span className="text-xs px-3 py-1 rounded-full border border-[#A8C3FF] bg-[#E8F0FF] text-[var(--text-primary)] font-medium">
            STEP {step.step}
          </span>

          <div className="mt-4">
            <Image src={step.icon} width={143} height={135} alt="step icon" />
          </div>

          <h3 className="mt-4 text-3xl font-normal text-[var(--blue-deep)]">
            {step.title}
          </h3>

          <p className="text-[var(--text-primary)] leading-relaxed mt-6">
            {step.description}
          </p>
        </div>

        {/* RIGHT */}
        <div className="md:w-[70%] w-full">
          <Image
            src={step.image}
            alt="step preview"
            width={900}
            height={500}
            className="rounded-2xl w-full"
          />
        </div>
      </div>
    </div>
  );
}
