import Image, { StaticImageData } from "next/image";

interface PageBackgroundProps {
  image: StaticImageData | string;
  alt?: string;
  opacityClass?: string;
  overlayClass?: string;
}

export default function PageBackground({
  image,
  alt = "Page Background",
  opacityClass = "opacity-[0.38] sm:opacity-[0.45]",
  overlayClass = "bg-gradient-to-b from-white/70 via-slate-50/60 to-slate-100/80 backdrop-blur-[0.5px]",
}: PageBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      <div className={`relative h-full w-full ${opacityClass} transition-opacity duration-500`}>
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-102"
        />
      </div>
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
}
