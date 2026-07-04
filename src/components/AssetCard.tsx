import Link from "next/link";
import { PLATFORM_META, money } from "@/lib/format";

type AssetCardProps = {
  asset: {
    slug: string;
    title: string;
    description: string | null;
    is_first_party: boolean;
    rating_avg: number;
    rating_count: number;
    sales_count: number;
    platform: string;
    min_price_cents: number;
  };
};

export default function AssetCard({ asset }: AssetCardProps) {
  const meta = PLATFORM_META[asset.platform] ?? PLATFORM_META.wordpress;
  return (
    <Link
      href={`/asset/${asset.slug}`}
      className="card overflow-hidden hover:border-pulse-500/60 transition-colors group"
    >
      <div
        className={`h-36 bg-gradient-to-br ${meta.gradient} relative flex items-end p-3`}
      >
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
        <span className={`badge ${meta.color} bg-ink-950/60 backdrop-blur relative`}>
          {meta.label}
        </span>
        {/* Watermarked preview placeholder (DRM per PRD §9) */}
        <span className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-white/40">
          DesignPulse preview
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white group-hover:text-pulse-400 transition-colors">
            {asset.title}
          </h3>
          <span className="text-pulse-400 font-semibold whitespace-nowrap">
            {money(asset.min_price_cents)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400 line-clamp-2">{asset.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          {asset.rating_count > 0 && (
            <span className="text-amber-400">
              ★ {Number(asset.rating_avg).toFixed(1)}{" "}
              <span className="text-slate-500">({asset.rating_count})</span>
            </span>
          )}
          <span>{asset.sales_count} sales</span>
          {asset.is_first_party && (
            <span className="badge border-pulse-500/40 text-pulse-400 ml-auto">
              Gambix Official
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
