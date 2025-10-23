import Image from "next/image";

interface StandardImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string; // Optional className for custom styling
}

const StandardImage = ({
  src,
  alt,
  width,
  height,
  className,
}: StandardImageProps) => {
  return (
    <div className={className}>
      <Image src={src} alt={alt} width={width} height={height} />
    </div>
  );
};

export default StandardImage;
