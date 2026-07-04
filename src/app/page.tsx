import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAssets } from "@/lib/queries";
import AssetCard from "@/components/AssetCard";
import { PLATFORM_META } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const [featured, trending] = await Promise.all([
    fetchAssets(supabase, { featuredOnly: true, limit: 8 }),
    fetchAssets(supabase, { sort: "trending", limit: 4 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="py-16 text-center">
        <p className="badge border-pulse-500/40 text-pulse-400 mb-4">
          Every asset passes automated checks + human review
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          Premium templates.
          <br />
          <span className="bg-gradient-to-r from-pulse-400 to-fuchsia-400 bg-clip-text text-transparent">
            Zero quality roulette.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-slate-400 text-lg">
          Curated design templates for Wix Studio, Webflow, WordPress, and Shopify —
          plus Go High Level snapshots delivered straight into your sub-account.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/marketplace" className="btn-primary text-base px-6 py-3">
            Browse the marketplace
          </Link>
          <Link href="/sell" className="btn-ghost text-base px-6 py-3">
            Sell your work
          </Link>
        </div>
      </section>

      <section className="py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(PLATFORM_META).map(([key, meta]) => (
            <Link
              key={key}
              href={`/marketplace?platform=${key}`}
              className={`card p-4 text-center hover:border-pulse-500/60 transition-colors`}
            >
              <div
                className={`mx-auto h-10 w-10 rounded-lg bg-gradient-to-br ${meta.gradient} mb-2`}
              />
              <div className="text-sm font-medium text-white">{meta.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold text-white">Featured by Gambix</h2>
          <Link href="/marketplace" className="text-sm text-pulse-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold text-white">Trending this week</h2>
          <Link
            href="/marketplace?sort=trending"
            className="text-sm text-pulse-400 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </section>

      <section className="py-14 grid md:grid-cols-3 gap-5">
        {[
          {
            t: "4-layer quality control",
            d: "Automated scanning, human review against a documented rubric, seller tiering, and post-launch monitoring. Bad assets don't survive here.",
          },
          {
            t: "Instant, secure delivery",
            d: "Tokenized 72-hour download links, unique license keys per purchase, and one-click GHL snapshot import into your sub-account.",
          },
          {
            t: "Fair to sellers",
            d: "Flat 15% commission via Stripe Connect. Trusted sellers get expedited review; exclusive sellers earn reduced rates.",
          },
        ].map((f) => (
          <div key={f.t} className="card p-6">
            <h3 className="font-semibold text-white mb-2">{f.t}</h3>
            <p className="text-sm text-slate-400">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
