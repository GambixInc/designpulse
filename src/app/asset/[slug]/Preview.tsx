import Image from "next/image";

export type PreviewData = {
  title: string;
  images: string[];
  platformLabel: string;
  gradient: string;
  demoUrl: string | null;
};

// View-only watermark over every preview (PRD §9).
function Watermark({ large }: { large?: boolean }) {
  return large ? (
    <div className="absolute inset-0 grid place-items-center rotate-[-18deg] text-4xl font-black tracking-widest text-white/15 pointer-events-none">
      DESIGNPULSE · PREVIEW · DESIGNPULSE
    </div>
  ) : (
    <span className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/80 backdrop-blur pointer-events-none">
      DesignPulse preview
    </span>
  );
}

export function PreviewHero({ preview }: { preview: PreviewData }) {
  const cover = preview.images[0];
  return (
    <div
      className={`relative h-72 md:h-96 rounded-2xl bg-gradient-to-br ${preview.gradient} overflow-hidden select-none`}
    >
      {cover ? (
        <Image
          src={cover}
          alt={`${preview.title} home page`}
          fill
          priority
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_55%)]" />
      )}
      <Watermark large />
      <span className="badge bg-black/40 text-white border-white/20 backdrop-blur absolute bottom-4 left-4">
        {preview.platformLabel}
      </span>
      {preview.demoUrl && (
        <a
          href={preview.demoUrl}
          target="_blank"
          className="btn bg-black/50 text-white border border-white/20 backdrop-blur absolute bottom-4 right-4 hover:bg-black/70"
        >
          View live demo ↗
        </a>
      )}
    </div>
  );
}

// Two desktop sections stacked beside a full-height mobile shot.
export function PreviewGallery({ preview }: { preview: PreviewData }) {
  const [, ...rest] = preview.images;
  if (rest.length < 3) return null;
  const [first, second, mobile] = rest;
  const tile = "relative overflow-hidden rounded-xl border border-line bg-card select-none";
  return (
    <div className="mt-3 grid grid-cols-3 gap-3">
      {[first, second].map((src, i) => (
        <div key={src} className={`${tile} col-span-2 aspect-[16/10]`}>
          <Image src={src} alt={`${preview.title} section ${i + 2}`} fill sizes="(min-width: 1024px) 44vw, 66vw" className="object-cover object-top" />
          <Watermark />
        </div>
      ))}
      <div className={`${tile} col-start-3 row-start-1 row-span-2 bg-neutral-900 p-3`}>
        <div className="relative h-full w-full">
          <Image src={mobile} alt={`${preview.title} on mobile`} fill sizes="(min-width: 1024px) 22vw, 33vw" className="object-contain" />
        </div>
        <Watermark />
      </div>
    </div>
  );
}
