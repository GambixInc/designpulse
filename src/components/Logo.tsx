import Image from "next/image";

// Wordmark exported from the "Design Pulse Logo" Canva design. The dark
// variant recolours the black letters for dark surfaces; teal is unchanged.
const WIDTH = 720;
const HEIGHT = 136;

export default function Logo({ className = "h-7" }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/logo-light.png"
        alt="DesignPulse"
        width={WIDTH}
        height={HEIGHT}
        priority
        className={`${className} w-auto dark:hidden`}
      />
      <Image
        src="/brand/logo-dark.png"
        alt="DesignPulse"
        width={WIDTH}
        height={HEIGHT}
        priority
        className={`${className} w-auto hidden dark:block`}
      />
    </>
  );
}
