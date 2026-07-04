"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, dateFmt } from "@/lib/format";

const RUBRIC = [
  ["visual_design", "Visual design quality"],
  ["responsiveness", "Responsiveness / mobile"],
  ["cross_browser", "Cross-browser compat"],
  ["code_quality", "Code quality"],
  ["documentation", "Documentation"],
  ["originality", "Originality"],
] as const;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"queue" | "sellers" | "refunds" | "catalog">("queue");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);

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
      { data: subs },
      { data: sellerRows },
      { data: refundRows },
      { data: orderItems },
      { data: assets },
    ] = await Promise.all([
      supabase
        .from("submissions")
        .select("*, assets(title, slug, description), profiles!submissions_seller_id_fkey(full_name, email)")
        .eq("outcome", "pending")
        .order("submitted_at"),
      supabase.from("seller_profiles").select("*, profiles!seller_profiles_id_fkey(email)").order("created_at", { ascending: false }),
      supabase
        .from("refund_requests")
        .select("*, order_items(price_cents, assets(title))")
        .eq("status", "open"),
      supabase.from("order_items").select("price_cents, commission_cents, refunded"),
      supabase
        .from("assets")
        .select("id, title, slug, status, is_featured, is_first_party, sales_count, rating_avg")
        .order("sales_count", { ascending: false }),
    ]);
    setQueue(subs ?? []);
    setSellers(sellerRows ?? []);
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

  const review = async (subId: string, outcome: "pass" | "fail" | "revise") => {
    const notes =
      prompt(
        outcome === "pass"
          ? "Reviewer notes (optional):"
          : "Reviewer notes — tell the seller what to fix:"
      ) ?? "";
    const scores: Record<string, number> = {};
    if (outcome === "pass") RUBRIC.forEach(([k]) => (scores[k] = 5));
    else RUBRIC.forEach(([k]) => (scores[k] = 3));
    const { error } = await supabase.rpc("review_submission", {
      p_submission_id: subId,
      p_outcome: outcome,
      p_notes: notes,
      p_scores: scores,
    });
    if (error) alert(error.message);
    else load();
  };

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
    const notes = prompt("Admin notes:") ?? "";
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

  if (loading)
    return <p className="text-center py-24 text-slate-400">Loading admin…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-6">Gambix Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          ["GMV", money(stats.gmv)],
          ["Platform revenue", money(stats.revenue)],
          ["Items sold", String(stats.orders)],
          ["Refund rate", `${stats.refundRate}%`],
        ].map(([t, v]) => (
          <div key={t} className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{t}</p>
            <p className="text-2xl font-bold text-white mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["queue", `Review queue (${queue.length})`],
            ["sellers", `Sellers (${sellers.length})`],
            ["refunds", `Refunds (${refunds.length})`],
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

      {tab === "queue" &&
        (queue.length === 0 ? (
          <div className="card p-10 text-center text-slate-400">
            Review queue is empty. 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((s) => (
              <div key={s.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{s.assets?.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      by {s.profiles?.full_name ?? "Unknown"} ({s.profiles?.email}) ·
                      submitted {dateFmt(s.submitted_at)}
                    </p>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                      {s.assets?.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(s.layer1_results ?? {}).map(([k, v]) => (
                        <span
                          key={k}
                          className={`badge ${v === "passed" ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400"}`}
                        >
                          {k.replace(/_/g, " ")}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => review(s.id, "pass")} className="btn-primary">
                      Approve
                    </button>
                    <button onClick={() => review(s.id, "revise")} className="btn-ghost">
                      Revise
                    </button>
                    <button
                      onClick={() => review(s.id, "fail")}
                      className="btn-ghost text-red-400 border-red-500/40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "sellers" && (
        <div className="card divide-y divide-ink-700">
          {sellers.map((sp) => (
            <div key={sp.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-48">
                <p className="text-white font-medium">{sp.display_name}</p>
                <p className="text-xs text-slate-500">
                  {sp.profiles?.email} · applied {dateFmt(sp.created_at)} ·{" "}
                  {(sp.commission_rate * 100).toFixed(0)}% commission
                </p>
              </div>
              <span
                className={`badge ${
                  sp.application_status === "approved"
                    ? "border-emerald-500/40 text-emerald-400"
                    : sp.application_status === "pending"
                      ? "border-amber-500/40 text-amber-400"
                      : "border-red-500/40 text-red-400"
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
          ))}
        </div>
      )}

      {tab === "refunds" &&
        (refunds.length === 0 ? (
          <div className="card p-10 text-center text-slate-400">
            No open refund requests.
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">
                      {r.order_items?.assets?.title} —{" "}
                      {money(r.order_items?.price_cents ?? 0)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">“{r.reason}”</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested {dateFmt(r.created_at)} · 7-day defect-only policy
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => resolveRefund(r.id, true)} className="btn-primary">
                      Approve refund
                    </button>
                    <button onClick={() => resolveRefund(r.id, false)} className="btn-ghost">
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "catalog" && (
        <div className="card divide-y divide-ink-700">
          {catalog.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="flex-1 min-w-48">
                <p className="text-white font-medium">
                  {a.title}
                  {a.is_first_party && (
                    <span className="badge border-pulse-500/40 text-pulse-400 ml-2">
                      1st party
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
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
                  className="btn-ghost text-red-400 border-red-500/40"
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
