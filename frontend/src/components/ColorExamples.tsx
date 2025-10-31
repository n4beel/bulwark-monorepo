// Example component showing how to use the centralized colors
"use client";

export default function ColorExamples() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        Color System Examples
      </h2>

      {/* Base colors */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Base Colors
        </h3>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-[var(--white)] border border-gray-300 rounded"></div>
          <div className="w-16 h-16 bg-[var(--black)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--gray-light)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--gray-medium)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--gray-dark)] rounded"></div>
        </div>
      </div>

      {/* Blue palette */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Blue Palette
        </h3>
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-[var(--blue-primary)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--blue-secondary)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--blue-light)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--blue-hover)] rounded"></div>
          <div className="w-16 h-16 bg-[var(--blue-dark)] rounded"></div>
        </div>
      </div>

      {/* Button examples */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Button Examples
        </h3>
        <div className="flex gap-4">
          <button className="bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-md">
            Primary Button
          </button>
          <button className="bg-[var(--button-secondary)] hover:bg-[var(--button-secondary-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-md">
            Secondary Button
          </button>
        </div>
      </div>

      {/* Text examples */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Text Colors
        </h3>
        <p className="text-[var(--text-primary)]">Primary text color</p>
        <p className="text-[var(--text-secondary)]">Secondary text color</p>
        <p className="text-[var(--text-inverse)] bg-[var(--blue-primary)] px-2 py-1 rounded">
          Inverse text color
        </p>
      </div>
    </div>
  );
}
