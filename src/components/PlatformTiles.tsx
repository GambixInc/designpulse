import Image from "next/image";
import Link from "next/link";
import { PLATFORM_META } from "@/lib/format";

function countLabel(platform: string, count: number | undefined) {
  if (count === undefined) return null;
  const noun = platform === "ghl" ? "snapshot" : "template";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export default function PlatformTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Object.entries(PLATFORM_META).map(([key, meta]) => (
        <Link
          key={key}
          href={`/marketplace?platform=${key}`}
          className="card card-hover group flex flex-col items-center gap-3 px-4 py-6 text-center last:col-span-2 sm:last:col-span-1"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-canvas transition-colors group-hover:border-accent/40">
            <Image
              src={meta.logo}
              alt=""
              width={30}
              height={30}
              unoptimized
              className={`h-[30px] w-[30px] object-contain ${meta.invertOnDark ? "dark:invert" : ""}`}
            />
          </span>
          <span>
            <span className="block whitespace-nowrap text-sm font-semibold text-ink">{meta.label}</span>
            <span className="mt-0.5 block text-xs text-faint">{countLabel(key, counts[key])}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
