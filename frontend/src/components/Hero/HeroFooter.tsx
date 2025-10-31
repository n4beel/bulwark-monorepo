import Chip from "../ui/Chip";

export default function HeroFooter() {
  return (
    <div className="w-full py-2">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-center gap-6 ">
        <Chip
          label="Encrypted by Arcium"
          iconSrc="https://res.cloudinary.com/ahmed8215/image/upload/Arcium_jqbxu1.svg"
          size="md"
        />
        <Chip
          label="Built for"
          iconSrc="/icons/Solana.svg"
          iconSide="right"
          size="md"
        />
      </div>
    </div>
  );
}
