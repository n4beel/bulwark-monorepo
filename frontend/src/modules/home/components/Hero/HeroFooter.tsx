import Chip from '../../../../components/ui/Chip';

export default function HeroFooter() {
  return (
    <div className="w-full py-6">
      <div className="mx-auto flex flex-wrap justify-center items-center gap-4 max-w-[720px] px-4">
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
