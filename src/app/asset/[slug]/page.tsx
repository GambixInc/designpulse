import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import { PLATFORM_META, CONNECTOR_META, dateFmt } from "@/lib/format";
import BuyBox from "./BuyBox";
import DetailTabs from "./DetailTabs";

export const dynamic = "force-dynamic";

type Review = {
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export default async function AssetPage({ params }: { params: { slug: string } }) {
  const { supabase, user } = await getSessionProfile();
  const { data: asset } = await supabase
    .from("assets")
    .select(
      "*, categories(name, platform), asset_licenses(id, tier, price_cents), reviews(rating, comment, created_at, profiles(full_name))"
    )
    .eq("slug", params.slug)
    .single();

  if (!asset) notFound();

  let sellerName = "Gambix Official";
  let sellerTier: string | null = null;
  let sellerAssets = 0;
  if (!asset.is_first_party && asset.seller_id) {
    const [{ data: sp }, { count }] = await Promise.all([
      supabase
        .from("seller_profiles")
        .select("display_name, tier")
        .eq("id", asset.seller_id)
        .single(),
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", asset.seller_id)
        .eq("status", "approved"),
    ]);
    if (sp) {
      sellerName = sp.display_name;
      sellerTier = sp.tier;
    }
    sellerAssets = count ?? 0;
  }

  const platform = asset.categories?.platform ?? "wordpress";
  const meta = PLATFORM_META[platform];
  const connector = CONNECTOR_META[platform];
  const compat = (asset.compatibility ?? {}) as Record<string, unknown>;
  const isGhl = platform === "ghl";
  const reviews = (asset.reviews ?? []) as Review[];

  const overview = (
    <div>
      <p className="text-muted leading-relaxed">{asset.description}</p>
      {asset.features?.length > 0 && (
        <ul className="mt-6 grid sm:grid-cols-2 gap-2.5">
          {asset.features.map((f: string) => (
            <li key={f} className="flex gap-2 text-sm text-ink">
              <span className="text-accent">✓</span> {f}
            </li>
          ))}
        </ul>
      )}
      <div className="card p-4 mt-6 text-sm text-muted">
        <span className="font-medium text-ink">Delivery: </span>
        {connector.method}
        {isGhl && " — GHL sub-account OAuth connection is required at checkout."}
      </div>
    </div>
  );

  const compatibility = (
    <div className="card p-5 text-sm text-ink space-y-2">
      {Object.entries(compat).map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <span className="text-faint capitalize w-44 shrink-0">
            {k.replace(/_/g, " ")}:
          </span>
          <span>
            {Array.isArray(v) ? (v.length ? v.join(", ") : "None") : String(v)}
          </span>
        </div>
      ))}
      {isGhl && (
        <p className="pt-2 text-accent">
          ⚡ Delivered via the GHL Snapshot API directly into your connected
          sub-account — no file download. Conflict detection runs before the
          final import.
        </p>
      )}
    </div>
  );

  const reviewsTab =
    reviews.length === 0 ? (
      <p className="text-sm text-faint">
        {asset.rating_count > 0
          ? "Ratings imported from launch catalog."
          : "No reviews yet. Verified buyers can leave the first one."}
      </p>
    ) : (
      <div className="space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-amber-500">{"★".repeat(r.rating)}</span>
              <span className="text-ink font-medium">
                {r.profiles?.full_name ?? "Verified buyer"}
              </span>
              <span className="text-faint">{dateFmt(r.created_at)}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
          </div>
        ))}
      </div>
    );

  const changelog = (
    <div className="space-y-4 text-sm">
      {asset.updated_at !== asset.created_at && (
        <div className="flex gap-4">
          <span className="text-faint w-28 shrink-0">{dateFmt(asset.updated_at)}</span>
          <div>
            <p className="text-ink font-medium">v1.1.0</p>
            <p className="text-muted">Listing details and compatibility updated.</p>
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <span className="text-faint w-28 shrink-0">{dateFmt(asset.created_at)}</span>
        <div>
          <p className="text-ink font-medium">v1.0.0</p>
          <p className="text-muted">Initial release on DesignPulse.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-sm text-faint mb-6">
        <Link href="/marketplace" className="hover:text-ink">Marketplace</Link>
        {" / "}
        <Link
          href={`/marketplace?platform=${platform}`}
          className="hover:text-ink"
        >
          {asset.categories?.name}
        </Link>
        {" / "}
        <span className="text-muted">{asset.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Watermarked preview area (PRD §9: view-only, overlay watermark) */}
          <div
            className={`relative h-72 md:h-96 rounded-2xl bg-gradient-to-br ${meta.gradient} overflow-hidden select-none`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_55%)]" />
            <div className="absolute inset-0 grid place-items-center opacity-20 rotate-[-18deg] text-4xl font-black tracking-widest text-white pointer-events-none">
              DESIGNPULSE · PREVIEW · DESIGNPULSE
            </div>
            <span className="badge bg-black/40 text-white border-white/20 backdrop-blur absolute bottom-4 left-4">
              {meta.label}
            </span>
            {asset.demo_url && (
              <a
                href={asset.demo_url}
                target="_blank"
                className="btn bg-black/40 text-white border border-white/20 backdrop-blur absolute bottom-4 right-4 hover:bg-black/60"
              >
                View live demo ↗
              </a>
            )}
          </div>

          <div className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight text-ink">{asset.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>
                by <span className="text-accent font-medium">{sellerName}</span>
              </span>
              {asset.rating_count > 0 && (
                <span className="text-amber-500">
                  ★ {Number(asset.rating_avg).toFixed(1)} ({asset.rating_count} reviews)
                </span>
              )}
              <span>{asset.sales_count} sales</span>
            </div>
          </div>

          <DetailTabs
            tabs={[
              { label: "Overview", content: overview },
              { label: "Compatibility", content: compatibility },
              { label: `Reviews (${asset.rating_count})`, content: reviewsTab },
              { label: "Changelog", content: changelog },
            ]}
          />
        </div>

        <div className="space-y-4">
          <BuyBox
            assetId={asset.id}
            licenses={asset.asset_licenses}
            isGhl={isGhl}
            signedIn={!!user}
            slug={asset.slug}
          />
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-faint mb-3">Seller</p>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-accent-soft grid place-items-center text-accent font-semibold">
                {sellerName.slice(0, 1)}
              </span>
              <div>
                <p className="font-medium text-ink">{sellerName}</p>
                <p className="text-xs text-muted">
                  {asset.is_first_party
                    ? "Gambix first-party studio"
                    : `${sellerTier ?? "probationary"} seller · ${sellerAssets} live asset${sellerAssets === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
