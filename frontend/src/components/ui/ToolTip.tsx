import { useState } from "react";

// Tooltip Component
function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      {children}
      {open && (
        <div className="absolute z-50 w-48 text-xs bg-[var(--background)] text-[var(--text-primary)] p-2 shadow-lg border border-[var(--border-color)] rounded-lg top-6 right-0">
          {text}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
