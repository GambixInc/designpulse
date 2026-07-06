"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, dateFmt } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

type Stats = {
  gmv: number;
  revenue: number;
  orders: number;
  refundRate: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"sellers" | "refunds" | "catalog">("sellers");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [sellers, setSellers] = useState<Row[]>([]);
  const [refundMetrics, setRefundMetrics] = useState<Map<string, Row>>(new Map());
  const [refunds, setRefunds] = useState<Row[]>([]);
  const [catalog, setCatalog] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/admin");
      return;
    }
    const { data: me } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") {
      router.push("/");
      return;
    }
    const [
      { count: queueCount },
      { data: sellerRows },
      { data: metricRows },
      { data: refundRows },
      { data: orderItems },
      { data: assets },
    ] = await Promise.all([
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("outcome", "pending"),
      supabase
        .from("seller_profiles")
        .select("*, profiles!seller_profiles_id_fkey(email)")
        .order("created_at", { ascending: false }),
      supabase.from("seller_refund_metrics").select("*"),
      supabase
        .from("refund_requests")
        .select("*, order_items(price_cents, commission_cents, seller_earnings_cents, assets(title))")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("order_items").select("price_cents, commission_cents, refunded"),
      supabase
        .from("assets")
        .select("id, title, slug, status, is_featured, is_first_party, sales_count, rating_avg")
        .order("sales_count", { ascending: false }),
    ]);
    setPendingReviews(queueCount ?? 0);
    setSellers(sellerRows ?? []);
    setRefundMetrics(new Map((metricRows ?? []).map((m: Row) => [m.seller_id, m])));
    setRefunds(refundRows ?? []);
    setCatalog(assets ?? []);

    const items = orderItems ?? [];
    const gmv = items.filter((i) => !i.refunded).reduce((n, i) => n + i.price_cents, 0);
    const rev = items.filter((i) => !i.refunded).reduce((n, i) => n + i.commission_cents, 0);
    setStats({
      gmv,
      revenue: rev,
      orders: items.length,
      refundRate: items.length
        ? ((items.filter((i) => i.refunded).length / items.length) * 100).toFixed(1)
        : "0.0",
    });
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const reviewSeller = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc("review_seller_application", {
      p_seller_id: id,
      p_approve: approve,
    });
    if (error) alert(error.message);
    else load();
  };

  const setTier = async (id: string, tier: string) => {
    const { error } = await supabase
      .from("seller_profiles")
      .update({ tier, commission_rate: tier === "elite" ? 0.1 : 0.15 })
      .eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const resolveRefund = async (id: string, approve: boolean) => {
    const notes = prompt("Decision notes:") ?? "";
    const { error } = await supabase.rpc("resolve_refund", {
      p_refund_id: id,
      p_approve: approve,
      p_notes: notes,
    });
    if (error) alert(error.message);
    else load();
  };

  const toggleFeatured = async (id: string, val: boolean) => {
    const { error } = await supabase
      .from("assets")
      .update({ is_featured: val })
      .eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const delist = async (id: string) => {
    if (!confirm("Delist this asset? Buyers keep access; it leaves the storefront.")) return;
    const { error } = await supabase
      .from("assets")
      .update({ status: "delisted" })
      .eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  if (loading || !stats)
    return <p className="text-center py-24 text-muted">Loading admin…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-6">Gambix Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(
          [
            ["GMV", money(stats.gmv)],
            ["Platform revenue", money(stats.revenue)],
            ["Items sold", String(stats.orders)],
            ["Refund rate", `${stats.refundRate}%`],
          ] as const
        ).map(([t, v]) => (
          <div key={t} className="card p-4">
            <p className="text-xs text-faint uppercase tracking-wide">{t}</p>
            <p className="text-2xl font-bold text-ink mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="text-ink font-medium">Layer 2 review</span> is handled
          by the in-house review team on the review desk — {pendingReviews} submission
          {pendingReviews === 1 ? "" : "s"} pending. Reviewer accounts have their own
          role, separate from admin; every decision lands in the audit log.
        </p>
        <Link href="/review" className="btn-primary whitespace-nowrap">
          Open review desk →
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["sellers", `Sellers (${sellers.length})`],
            ["refunds", `Refunds (${refunds.filter((r) => r.status === "open").length} open)`],
            ["catalog", "Catalog"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "btn-primary" : "btn-ghost"}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sellers" && (
        <div className="card divide-y divide-line">
          {sellers.map((sp) => {
            const metrics = refundMetrics.get(sp.id);
            return (
              <div key={sp.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-48">
                  <p className="text-ink font-medium">{sp.display_name}</p>
                  <p className="text-xs text-faint">
                    {sp.profiles?.email} · applied {dateFmt(sp.created_at)} ·{" "}
                    {(sp.commission_rate * 100).toFixed(0)}% commission
                    {metrics &&
                      ` · refund rate ${metrics.refund_rate_pct}% (${metrics.items_refunded}/${metrics.items_sold})`}
                  </p>
                </div>
                {metrics && Number(metrics.refund_rate_pct) >= 20 && (
                  <span className="badge border-red-500/40 text-red-500">
                    ⚑ High refund rate
                  </span>
                )}
                <span
                  className={`badge ${
                    sp.application_status === "approved"
                      ? "border-emerald-500/40 text-emerald-500"
                      : sp.application_status === "pending"
                        ? "border-amber-500/40 text-amber-500"
                        : "border-red-500/40 text-red-500"
                  }`}
                >
                  {sp.application_status}
                </span>
                {sp.application_status === "pending" ? (
                  <>
                    <button onClick={() => reviewSeller(sp.id, true)} className="btn-primary">
                      Approve
                    </button>
                    <button onClick={() => reviewSeller(sp.id, false)} className="btn-ghost">
                      Reject
                    </button>
                  </>
                ) : (
                  <select
                    className="input !w-auto"
                    value={sp.tier}
                    onChange={(e) => setTier(sp.id, e.target.value)}
                  >
                    <option value="probationary">Probationary</option>
                    <option value="trusted">Trusted</option>
                    <option value="elite">Elite (10% commission)</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "refunds" &&
        (refunds.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            No refund requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="max-w-2xl">
                    <p className="text-ink font-medium">
                      {r.order_items?.assets?.title} —{" "}
                      {money(r.order_items?.price_cents ?? 0)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                      <span
                        className={`badge ${
                          r.status === "open"
                            ? "border-amber-500/40 text-amber-500"
                            : r.status === "approved"
                              ? "border-emerald-500/40 text-emerald-500"
                              : "border-red-500/40 text-red-500"
                        }`}
                      >
                        {r.status}
                      </span>
                      {r.flagged_change_of_mind && (
                        <span className="badge border-red-500/40 text-red-500">
                          ⚑ Change of mind — deny by default
                        </span>
                      )}
                      <span className="badge border-line text-faint">
                        {dateFmt(r.created_at)}
                      </span>
                      {r.commission_reversed_cents != null && (
                        <span className="badge border-line text-faint">
                          Reversed: {money(r.commission_reversed_cents)} commission +{" "}
                          {money(r.payout_reversed_cents ?? 0)} payout
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-2">“{r.reason}”</p>
                  </div>
                  {r.status === "open" && (
                    <div className="flex gap-2">
                      <button onClick={() => resolveRefund(r.id, true)} className="btn-primary">
                        Approve refund
                      </button>
                      <button onClick={() => resolveRefund(r.id, false)} className="btn-ghost">
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "catalog" && (
        <div className="card divide-y divide-line">
          {catalog.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="flex-1 min-w-48">
                <p className="text-ink font-medium">
                  {a.title}
                  {a.is_first_party && (
                    <span className="badge border-accent/40 text-accent ml-2">
                      1st party
                    </span>
                  )}
                </p>
                <p className="text-xs text-faint">
                  {a.sales_count} sales · ★ {Number(a.rating_avg).toFixed(1)} · {a.status}
                </p>
              </div>
              <button
                onClick={() => toggleFeatured(a.id, !a.is_featured)}
                className={a.is_featured ? "btn-primary" : "btn-ghost"}
              >
                {a.is_featured ? "★ Featured" : "☆ Feature"}
              </button>
              {a.status === "approved" && (
                <button
                  onClick={() => delist(a.id)}
                  className="btn-ghost text-red-500 border-red-500/40"
                >
                  Delist
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
