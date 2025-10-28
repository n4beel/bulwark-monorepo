import React from "react";
import Image from "next/image";

const ComingSoonChip = () => {
  return (
    <div className="flex flex-row   items-between text-xs py-2 px-3 gap-2  bg-[#EDF3FF] text-[var(--blue-primary)] rounded-full border border-[var(--blue-light)] w-fit">
      <Image
        src="/icons/Gemini.svg" // ✅ You will replace actual icon path
        alt="Coming soon"
        width={14}
        height={14}
      />
      <p className="text-center text-xs">Coming Soon</p>
    </div>
  );
};

export default ComingSoonChip;
