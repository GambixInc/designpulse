import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAssets } from "@/lib/queries";
import AssetCard from "@/components/AssetCard";
import { PLATFORM_META } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const [featured, fresh, catalogCount] = await Promise.all([
    fetchAssets(supabase, { featuredOnly: true, limit: 8 }),
    fetchAssets(supabase, { sort: "new", limit: 8 }),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .then((r) => r.count ?? 0),
  ]);

  const stats: [string, string][] = [
    [`${catalogCount}+`, "curated templates & snapshots"],
    ["5", "platforms covered"],
    ["100%", "human-reviewed before listing"],
    ["7-day", "defect refund guarantee"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="pt-20 pb-14 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink">
          Premium templates.
          <br />
          <span className="text-accent">Zero quality roulette.</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-muted text-lg">
          Curated design templates for Wix Studio, Webflow, WordPress, and
          Shopify — plus Go High Level snapshots delivered straight into your
          sub-account.
        </p>
        <form
          action="/marketplace"
          className="mt-8 mx-auto flex max-w-xl items-center gap-2"
        >
          <input
            name="q"
            placeholder="Search templates, themes, snapshots…"
            className="input !rounded-full !py-3 !px-5 text-base shadow-sm"
          />
          <button className="btn-primary !py-3 !px-6 text-base">Search</button>
        </form>
      </section>

      <section className="pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(PLATFORM_META).map(([key, meta]) => (
            <Link
              key={key}
              href={`/marketplace?platform=${key}`}
              className="card card-hover p-5 text-center"
            >
              <div
                className={`mx-auto h-11 w-11 rounded-xl bg-gradient-to-br ${meta.gradient} mb-3`}
              />
              <div className="text-sm font-medium text-ink">{meta.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Featured by Gambix
          </h2>
          <Link href="/marketplace" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            New arrivals
          </h2>
          <Link href="/marketplace" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fresh.slice(0, 8).map((a) => (
            <AssetCard key={a.id} asset={a} />
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="card px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(([n, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold text-ink">{n}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16">
        <div className="card p-10 md:p-14 text-center bg-ink text-canvas border-transparent">
          <h2 className="text-3xl font-semibold tracking-tight">
            Sell your designs on DesignPulse
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-canvas/70">
            Flat 15% commission, in-house human review with a 3–5 day SLA, and
            buyers who expect quality. Bring your Wix Studio, Webflow,
            WordPress, Shopify, or GHL work.
          </p>
          <Link
            href="/sell"
            className="btn mt-7 bg-canvas text-ink hover:opacity-90 px-7 py-3 text-base"
          >
            Apply as a seller
          </Link>
        </div>
      </section>
    </div>
  );
}
