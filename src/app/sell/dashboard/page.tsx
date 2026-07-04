"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, dateFmt } from "@/lib/format";

export default function SellerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/sell/dashboard");
        return;
      }
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (!sp || sp.application_status !== "approved") {
        router.push("/sell");
        return;
      }
      setProfile(sp);
      const [{ data: myAssets }, { data: mySales }, { data: mySubs }] =
        await Promise.all([
          supabase
            .from("assets")
            .select("id, title, slug, status, sales_count, rating_avg, rating_count, created_at")
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("order_items")
            .select("id, price_cents, seller_earnings_cents, commission_cents, refunded, license_tier, assets(title)")
            .eq("seller_id", user.id),
          supabase
            .from("submissions")
            .select("id, outcome, reviewer_notes, layer1_results, submitted_at, reviewed_at, assets(title)")
            .eq("seller_id", user.id)
            .order("submitted_at", { ascending: false }),
        ]);
      setAssets(myAssets ?? []);
      setSales(mySales ?? []);
      setSubmissions(mySubs ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return <p className="text-center py-24 text-slate-400">Loading seller hub…</p>;

  const active = sales.filter((s) => !s.refunded);
  const gross = active.reduce((n, s) => n + s.price_cents, 0);
  const earnings = active.reduce((n, s) => n + s.seller_earnings_cents, 0);
  const refundRate = sales.length
    ? ((sales.filter((s) => s.refunded).length / sales.length) * 100).toFixed(1)
    : "0.0";

  const statusBadge: Record<string, string> = {
    approved: "border-emerald-500/40 text-emerald-400",
    pending_review: "border-amber-500/40 text-amber-400",
    draft: "border-ink-600 text-slate-400",
    rejected: "border-red-500/40 text-red-400",
    delisted: "border-red-500/40 text-red-400",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{profile.display_name}</h1>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            <span className="badge border-pulse-500/40 text-pulse-400 mr-2">
              {profile.tier} tier
            </span>
            {(profile.commission_rate * 100).toFixed(0)}% platform commission ·
            payouts via Stripe Express (7–14 day rolling hold)
          </p>
        </div>
        <Link href="/sell/upload" className="btn-primary">+ Upload new asset</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          ["Units sold", String(active.length)],
          ["Gross sales", money(gross)],
          ["Your earnings", money(earnings)],
          ["Refund rate", `${refundRate}%`],
        ].map(([t, v]) => (
          <div key={t} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{t}</p>
            <p className="text-2xl font-bold text-white mt-1">{v}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Your assets</h2>
        {assets.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">
            No assets yet — upload your first one.
          </div>
        ) : (
          <div className="card divide-y divide-ink-700">
            {assets.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-48">
                  <p className="text-white font-medium">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.sales_count} sales
                    {a.rating_count > 0 &&
                      ` · ★ ${Number(a.rating_avg).toFixed(1)} (${a.rating_count})`}
                  </p>
                </div>
                <span className={`badge ${statusBadge[a.status]}`}>
                  {a.status.replace("_", " ")}
                </span>
                {a.status === "approved" && (
                  <Link href={`/asset/${a.slug}`} className="btn-ghost">View</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Submission history</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="card p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-white font-medium">{s.assets?.title}</span>
                  <span
                    className={`badge ${
                      s.outcome === "pass"
                        ? "border-emerald-500/40 text-emerald-400"
                        : s.outcome === "pending"
                          ? "border-amber-500/40 text-amber-400"
                          : "border-red-500/40 text-red-400"
                    }`}
                  >
                    {s.outcome}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    Submitted {dateFmt(s.submitted_at)}
                    {s.reviewed_at && ` · Reviewed ${dateFmt(s.reviewed_at)}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Layer 1 automated checks:{" "}
                  {Object.entries(s.layer1_results ?? {})
                    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                    .join(" · ")}
                </p>
                {s.reviewer_notes && (
                  <p className="mt-2 text-slate-300 border-l-2 border-pulse-500 pl-3">
                    Reviewer: {s.reviewer_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
