"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, dateFmt, LICENSE_INFO, PLATFORM_META } from "@/lib/format";

type Purchase = {
  order_item_id: string;
  order_id: string;
  created_at: string;
  title: string;
  slug: string;
  platform: string;
  license_tier: string;
  price_cents: number;
  refunded: boolean;
  license_key: string | null;
  asset_id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ghlModal, setGhlModal] = useState<Purchase | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/dashboard");
      return;
    }
    const [{ data: orders }, { data: wishes }] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, created_at, order_items(id, license_tier, price_cents, refunded, asset_id, assets(title, slug, categories(platform)))"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("wishlists")
        .select("asset_id, assets(title, slug, categories(platform))"),
    ]);
    const { data: keys } = await supabase
      .from("license_keys")
      .select("order_item_id, key");
    const keyMap = new Map((keys ?? []).map((k) => [k.order_item_id, k.key]));

    const rows: Purchase[] = [];
    (orders ?? []).forEach((o: any) =>
      (o.order_items ?? []).forEach((oi: any) =>
        rows.push({
          order_item_id: oi.id,
          order_id: o.id,
          created_at: o.created_at,
          title: oi.assets?.title,
          slug: oi.assets?.slug,
          platform: oi.assets?.categories?.platform,
          license_tier: oi.license_tier,
          price_cents: oi.price_cents,
          refunded: oi.refunded,
          license_key: keyMap.get(oi.id) ?? null,
          asset_id: oi.asset_id,
        })
      )
    );
    setPurchases(rows);
    setWishlist(wishes ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (p: Purchase) => {
    const { data, error } = await supabase.rpc("regenerate_download_token", {
      p_order_item_id: p.order_item_id,
    });
    if (error) alert(error.message);
    else window.open(`/api/download/${data}`, "_blank");
  };

  const requestRefund = async (p: Purchase) => {
    const reason = prompt(
      "Describe the technical defect (refunds cover verifiable defects only, within 7 days):"
    );
    if (!reason) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("refund_requests").insert({
      order_item_id: p.order_item_id,
      buyer_id: user!.id,
      reason,
    });
    alert(error ? error.message : "Refund request submitted for admin review.");
  };

  const review = async (p: Purchase, rating: number) => {
    const comment = prompt("Add a comment (optional):") ?? null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("reviews").upsert(
      { asset_id: p.asset_id, buyer_id: user!.id, rating, comment },
      { onConflict: "asset_id,buyer_id" }
    );
    alert(error ? error.message : "Thanks — your verified review is live.");
  };

  if (loading)
    return <p className="text-center py-24 text-slate-400">Loading your library…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8">My library</h1>

      {purchases.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">No purchases yet.</p>
          <Link href="/marketplace" className="btn-primary mt-4">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.wordpress;
            const isGhl = p.platform === "ghl";
            return (
              <div key={p.order_item_id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/asset/${p.slug}`}
                      className="font-semibold text-white hover:text-pulse-400"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className={`badge ${meta.color}`}>{meta.label}</span>
                      <span>{LICENSE_INFO[p.license_tier]?.label}</span>
                      <span>·</span>
                      <span>{dateFmt(p.created_at)}</span>
                      <span>·</span>
                      <span>{money(p.price_cents)}</span>
                      {p.refunded && (
                        <span className="badge border-red-500/40 text-red-400">
                          Refunded
                        </span>
                      )}
                    </div>
                    {p.license_key && (
                      <p className="mt-2 text-xs">
                        <span className="text-slate-500">License key: </span>
                        <code className="text-pulse-400 bg-ink-800 px-2 py-0.5 rounded">
                          {p.license_key}
                        </code>
                      </p>
                    )}
                  </div>
                  {!p.refunded && (
                    <div className="flex flex-wrap gap-2">
                      {isGhl ? (
                        <button onClick={() => setGhlModal(p)} className="btn-primary">
                          ⚡ Import to GHL
                        </button>
                      ) : (
                        <button onClick={() => download(p)} className="btn-primary">
                          ⬇ Download
                        </button>
                      )}
                      <div className="btn-ghost gap-0.5" title="Rate this asset">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => review(p, n)}
                            className="hover:text-amber-400 text-slate-500 px-0.5"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <button onClick={() => requestRefund(p)} className="btn-ghost">
                        Refund
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wishlist.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Wishlist</h2>
          <div className="flex flex-wrap gap-2">
            {wishlist.map((w: any) => (
              <Link
                key={w.asset_id}
                href={`/asset/${w.assets?.slug}`}
                className="btn-ghost"
              >
                ♥ {w.assets?.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {ghlModal && (
        <GhlImportModal purchase={ghlModal} onClose={() => setGhlModal(null)} />
      )}
    </div>
  );
}

/**
 * Simulates the PRD §8 GHL delivery flow: OAuth connect → select sub-account →
 * review snapshot contents → conflict check → import.
 * Production swaps step handlers for GHL OAuth + POST /v1/locations/{id}/snapshots/load.
 */
function GhlImportModal({
  purchase,
  onClose,
}: {
  purchase: Purchase;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [subAccount, setSubAccount] = useState("Main Agency Account");
  const steps = ["Connect", "Select sub-account", "Review & import", "Done"];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
      <div className="card p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Import “{purchase.title}”</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        <div className="flex gap-1 mb-5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${i <= step ? "bg-pulse-500" : "bg-ink-700"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <p className="text-sm text-slate-400 mb-4">
              Connect your Go High Level account via OAuth so DesignPulse can load
              this snapshot into a sub-account you choose.
            </p>
            <button onClick={() => setStep(1)} className="btn-primary w-full">
              Connect GHL account (simulated OAuth)
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <label className="label">Target sub-account</label>
            <select
              className="input mb-4"
              value={subAccount}
              onChange={(e) => setSubAccount(e.target.value)}
            >
              <option>Main Agency Account</option>
              <option>Client — Acme Dental</option>
              <option>Client — Peak Fitness</option>
            </select>
            <button onClick={() => setStep(2)} className="btn-primary w-full">
              Continue
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <p className="text-sm text-slate-400 mb-3">
              Selective restore — choose components to import into{" "}
              <span className="text-white">{subAccount}</span>:
            </p>
            <div className="space-y-2 mb-4 text-sm">
              {["Funnels & pages", "Workflows & automations", "Pipelines", "Custom values & fields"].map(
                (c) => (
                  <label key={c} className="flex items-center gap-2 text-slate-300">
                    <input type="checkbox" defaultChecked className="accent-pulse-500" />
                    {c}
                  </label>
                )
              )}
            </div>
            <p className="text-xs text-emerald-400 mb-4">
              ✓ Conflict check passed — no existing assets will be overwritten.
            </p>
            <button onClick={() => setStep(3)} className="btn-primary w-full">
              Import snapshot
            </button>
          </>
        )}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-white font-medium">Snapshot imported</p>
            <p className="text-sm text-slate-400 mt-1">
              In production this calls GHL's Snapshot API
              (<code className="text-xs">POST /v1/locations/{"{id}"}/snapshots/load</code>)
              with your selected components. A share-link fallback is available if
              OAuth fails.
            </p>
            <button onClick={onClose} className="btn-ghost mt-5 w-full">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
