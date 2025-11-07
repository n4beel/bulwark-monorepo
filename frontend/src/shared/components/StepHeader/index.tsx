'use client';

type StepKey = string;

export type StepItem<T extends StepKey = StepKey> = {
  key: T;
  label: string;
};

interface StepHeaderProps<T extends StepKey = StepKey> {
  steps: Readonly<StepItem<T>[]>;
  activeKey: T;
  onClose?: () => void; // kept for future use
  className?: string;
  compact?: boolean; // e.g. tighter padding on small modals
}

export default function StepHeader<T extends StepKey>({
  steps,
  activeKey,
  className = '',
  compact = false,
}: StepHeaderProps<T>) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === activeKey),
  );
  const pct = Math.round(((activeIndex + 1) / steps.length) * 100);

  return (
    <div className={`relative ${className}`}>
      {/* Progress Bar */}
      <div className="h-[5px] w-full bg-[var(--border-color)] rounded-t-[26px]">
        <div
          className="h-full bg-[var(--button-primary)] transition-all rounded-tl-[26px]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step labels */}
      <div
        className={`flex justify-between ${compact ? 'px-2' : 'px-10'} pt-2 pb-2`}
      >
        {steps.map((s, i) => {
          const isActive = s.key === activeKey;
          const isDone = i < activeIndex;

          return (
            <div key={s.key} className="flex flex-col items-center">
              <span
                className={[
                  'text-[13px] no-underline',
                  isActive
                    ? 'text-[var(--blue-primary)] font-medium'
                    : isDone
                      ? 'text-[var(--text-secondary)]'
                      : 'text-[var(--gray-medium)]',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
