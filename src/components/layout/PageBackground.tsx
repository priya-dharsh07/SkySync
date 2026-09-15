import Image, { StaticImageData } from "next/image";

interface PageBackgroundProps {
  image: StaticImageData | string;
  alt?: string;
  opacityClass?: string;
  overlayClass?: string;
  heightClass?: string;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
}

export default function PageBackground({
  image,
  alt = "SkySync Page Visual",
  opacityClass = "opacity-85 sm:opacity-90",
  overlayClass = "bg-gradient-to-b from-white/30 via-slate-50/70 to-[#F8FAFC]",
  heightClass = "h-[450px] sm:h-[550px]",
  objectFit = "cover",
  objectPosition = "top center",
}: PageBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-0 left-0 right-0 w-full ${heightClass} pointer-events-none z-0 overflow-hidden select-none`}
    >
      <div className={`relative h-full w-full ${opacityClass} transition-opacity duration-300`}>
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className={`${
            objectFit === "contain" ? "object-contain" : "object-cover"
          }`}
          style={{ objectPosition }}
        />
      </div>
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
}
