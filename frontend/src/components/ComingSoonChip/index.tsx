import React from "react";
import Image from "next/image";

const ComingSoonChip = () => {
  return (
    <div className="inline-flex items-center gap-2 text-xs bg-[#EDF3FF] text-[var(--blue-primary)] px-1 py-1 rounded-full border border-[var(--blue-light)] w-[120px]">
      <Image
        src="/icons/Gemini.svg" // ✅ You will replace actual icon path
        alt="Coming soon"
        width={14}
        height={14}
      />
      Coming Soon
    </div>
  );
};

export default ComingSoonChip;
