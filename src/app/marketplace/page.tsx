import { createClient } from "@/lib/supabase/server";
import { fetchAssets } from "@/lib/queries";
import AssetCard from "@/components/AssetCard";
import { PLATFORM_META } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Search = {
  platform?: string;
  sort?: string;
  q?: string;
  rating?: string;
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const supabase = createClient();
  const assets = await fetchAssets(supabase, {
    platform: searchParams.platform,
    sort: searchParams.sort,
    q: searchParams.q,
    minRating: searchParams.rating ? Number(searchParams.rating) : undefined,
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
    return `/marketplace?${params.toString()}`;
  };

  const sorts = [
    ["new", "Newest"],
    ["trending", "Trending"],
    ["rating", "Top rated"],
    ["price_asc", "Price ↑"],
    ["price_desc", "Price ↓"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
        Browse the marketplace
      </h1>
      <p className="text-muted mb-7">
        Every listing passed automated checks and in-house human review.
      </p>

      <form action="/marketplace" className="mb-6 flex gap-2 max-w-xl">
        {searchParams.platform && (
          <input type="hidden" name="platform" value={searchParams.platform} />
        )}
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search templates, themes, snapshots…"
          className="input !rounded-full"
        />
        <button className="btn-primary">Search</button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link
          href={qs({ platform: undefined })}
          className={`pill ${!searchParams.platform ? "pill-active" : "pill-idle"}`}
        >
          All platforms
        </Link>
        {Object.entries(PLATFORM_META).map(([key, meta]) => (
          <Link
            key={key}
            href={qs({ platform: key })}
            className={`pill ${searchParams.platform === key ? "pill-active" : "pill-idle"}`}
          >
            {meta.label}
          </Link>
        ))}
        <span className="mx-1 text-line">|</span>
        <Link
          href={qs({ rating: searchParams.rating ? undefined : "4.5" })}
          className={`pill ${searchParams.rating ? "border-amber-500 text-amber-600 dark:text-amber-400" : "pill-idle"}`}
        >
          ★ 4.5+
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8 text-sm">
        <span className="text-faint">Sort:</span>
        {sorts.map(([key, label]) => (
          <Link
            key={key}
            href={qs({ sort: key === "new" ? undefined : key })}
            className={`px-2 py-1 rounded ${(searchParams.sort ?? "new") === key ? "text-accent font-medium" : "text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
        <span className="ml-auto text-faint">{assets.length} results</span>
      </div>

      {assets.length === 0 ? (
        <div className="card p-12 text-center text-muted">
          No assets match those filters yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {assets.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      )}
    </div>
  );
}
