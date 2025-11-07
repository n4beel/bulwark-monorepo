import Image from 'next/image';

const ComingSoonChip = () => {
  return (
    <div className="flex flex-row   items-between text-xs py-1 px-1  gap-1  bg-[#EDF3FF] text-[var(--blue-primary)] rounded-full border border-[var(--blue-light)] w-fit">
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
