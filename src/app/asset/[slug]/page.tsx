import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import { PLATFORM_META, dateFmt } from "@/lib/format";
import BuyBox from "./BuyBox";

export const dynamic = "force-dynamic";

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
  if (!asset.is_first_party && asset.seller_id) {
    const { data: sp } = await supabase
      .from("seller_profiles")
      .select("display_name, tier")
      .eq("id", asset.seller_id)
      .single();
    if (sp) {
      sellerName = sp.display_name;
      sellerTier = sp.tier;
    }
  }

  const meta = PLATFORM_META[asset.categories?.platform ?? "wordpress"];
  const compat = (asset.compatibility ?? {}) as Record<string, unknown>;
  const isGhl = asset.categories?.platform === "ghl";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
        {" / "}
        <Link
          href={`/marketplace?platform=${asset.categories?.platform}`}
          className="hover:text-white"
        >
          {asset.categories?.name}
        </Link>
        {" / "}
        <span className="text-slate-300">{asset.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Watermarked preview area (PRD §9: view-only, overlay watermark) */}
          <div
            className={`relative h-72 md:h-96 rounded-xl bg-gradient-to-br ${meta.gradient} overflow-hidden select-none`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
            <div className="absolute inset-0 grid place-items-center opacity-20 rotate-[-18deg] text-4xl font-black tracking-widest text-white pointer-events-none">
              DESIGNPULSE · PREVIEW · DESIGNPULSE
            </div>
            <span className={`badge ${meta.color} bg-ink-950/60 backdrop-blur absolute bottom-4 left-4`}>
              {meta.label}
            </span>
            {asset.demo_url && (
              <a
                href={asset.demo_url}
                target="_blank"
                className="btn-ghost absolute bottom-4 right-4 bg-ink-950/60 backdrop-blur"
              >
                View live demo ↗
              </a>
            )}
          </div>

          <div className="mt-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{asset.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                <span>
                  by{" "}
                  <span className="text-pulse-400 font-medium">{sellerName}</span>
                  {sellerTier && (
                    <span className="badge border-ink-600 text-slate-400 ml-2 capitalize">
                      {sellerTier} seller
                    </span>
                  )}
                </span>
                {asset.rating_count > 0 && (
                  <span className="text-amber-400">
                    ★ {Number(asset.rating_avg).toFixed(1)} ({asset.rating_count}{" "}
                    reviews)
                  </span>
                )}
                <span>{asset.sales_count} sales</span>
              </div>
            </div>
          </div>

          <p className="mt-5 text-slate-300 leading-relaxed">{asset.description}</p>

          {asset.features?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-3">Features</h2>
              <ul className="grid sm:grid-cols-2 gap-2">
                {asset.features.map((f: string) => (
                  <li key={f} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-pulse-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">Compatibility</h2>
            <div className="card p-4 text-sm text-slate-300 space-y-1.5">
              {Object.entries(compat).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-slate-500 capitalize w-40 shrink-0">
                    {k.replace(/_/g, " ")}:
                  </span>
                  <span>{Array.isArray(v) ? (v.length ? v.join(", ") : "None") : String(v)}</span>
                </div>
              ))}
              {isGhl && (
                <p className="pt-2 text-violet-300">
                  ⚡ Delivered via API import directly into your GHL sub-account —
                  no file download needed. Selective restore supported.
                </p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">
              Reviews ({asset.rating_count})
            </h2>
            {(asset.reviews ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">
                {asset.rating_count > 0
                  ? "Ratings imported from launch catalog."
                  : "No reviews yet. Verified buyers can leave the first one."}
              </p>
            ) : (
              <div className="space-y-3">
                {asset.reviews.map((r: any, i: number) => (
                  <div key={i} className="card p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                      <span className="text-white font-medium">
                        {r.profiles?.full_name ?? "Verified buyer"}
                      </span>
                      <span className="text-slate-500">{dateFmt(r.created_at)}</span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-slate-300">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <BuyBox
            assetId={asset.id}
            licenses={asset.asset_licenses}
            isGhl={isGhl}
            signedIn={!!user}
            slug={asset.slug}
          />
        </div>
      </div>
    </div>
  );
}
