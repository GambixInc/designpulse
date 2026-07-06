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
      className="card card-hover overflow-hidden group"
    >
      <div
        className={`h-44 bg-gradient-to-br ${meta.gradient} relative flex items-end p-3`}
      >
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_55%)]" />
        <span className="badge bg-black/40 text-white border-white/20 backdrop-blur relative">
          {meta.label}
        </span>
        {/* Watermarked preview placeholder (DRM per PRD §9) */}
        <span className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-white/50">
          DesignPulse preview
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink group-hover:text-accent transition-colors">
            {asset.title}
          </h3>
          <span className="text-ink font-semibold whitespace-nowrap">
            {money(asset.min_price_cents)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted line-clamp-2">{asset.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-faint">
          {asset.rating_count > 0 && (
            <span className="text-amber-500">
              ★ {Number(asset.rating_avg).toFixed(1)}{" "}
              <span className="text-faint">({asset.rating_count})</span>
            </span>
          )}
          <span>{asset.sales_count} sales</span>
          {asset.is_first_party && (
            <span className="badge border-accent/30 text-accent bg-accent-soft/60 ml-auto">
              Gambix Official
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
