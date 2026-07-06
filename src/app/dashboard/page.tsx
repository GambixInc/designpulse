"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, dateFmt, LICENSE_INFO, PLATFORM_META, REFUND_REASON_LABELS } from "@/lib/format";
import DeliveryModal from "@/components/DeliveryModal";
import GhlImportFlow, { type GhlImportRow } from "@/components/GhlImportFlow";
import RefundModal from "@/components/RefundModal";

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

type RefundStatus = { status: string; reason_category: string };

type WishlistRow = {
  asset_id: string;
  assets: { title: string; slug: string } | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [wishlist, setWishlist] = useState<WishlistRow[]>([]);
  const [imports, setImports] = useState<Map<string, GhlImportRow>>(new Map());
  const [refunds, setRefunds] = useState<Map<string, RefundStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [ghlModal, setGhlModal] = useState<Purchase | null>(null);
  const [installModal, setInstallModal] = useState<Purchase | null>(null);
  const [refundModal, setRefundModal] = useState<Purchase | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/dashboard");
      return;
    }
    const [{ data: orders }, { data: wishes }, { data: keys }, { data: importRows }, { data: refundRows }] =
      await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, created_at, order_items(id, license_tier, price_cents, refunded, asset_id, assets(title, slug, categories(platform)))"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("wishlists")
          .select("asset_id, assets(title, slug)"),
        supabase.from("license_keys").select("order_item_id, key"),
        supabase
          .from("ghl_imports")
          .select("id, status, conflicts, components, order_item_id, ghl_connections(location_name)"),
        supabase
          .from("refund_requests")
          .select("order_item_id, status, reason_category")
          .order("created_at", { ascending: false }),
      ]);

    const keyMap = new Map(
      ((keys ?? []) as { order_item_id: string; key: string }[]).map((k) => [k.order_item_id, k.key])
    );

    const importMap = new Map<string, GhlImportRow>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((importRows ?? []) as any[]).forEach((r) => {
      importMap.set(r.order_item_id, {
        id: r.id,
        status: r.status,
        conflicts: r.conflicts ?? [],
        components: r.components ?? [],
        location_name: r.ghl_connections?.location_name ?? "Connected sub-account",
      });
    });

    const refundMap = new Map<string, RefundStatus>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((refundRows ?? []) as any[]).forEach((r) => {
      if (!refundMap.has(r.order_item_id))
        refundMap.set(r.order_item_id, { status: r.status, reason_category: r.reason_category });
    });

    const rows: Purchase[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setWishlist((wishes ?? []) as unknown as WishlistRow[]);
    setImports(importMap);
    setRefunds(refundMap);
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
    return <p className="text-center py-24 text-muted">Loading your library…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">My library</h1>

      {purchases.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted">No purchases yet.</p>
          <Link href="/marketplace" className="btn-primary mt-4">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => {
            const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.wordpress;
            const isGhl = p.platform === "ghl";
            const imp = imports.get(p.order_item_id);
            const refund = refunds.get(p.order_item_id);
            return (
              <div key={p.order_item_id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/asset/${p.slug}`}
                      className="font-semibold text-ink hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className={`badge ${meta.color}`}>{meta.label}</span>
                      <span>{LICENSE_INFO[p.license_tier]?.label}</span>
                      <span>·</span>
                      <span>{dateFmt(p.created_at)}</span>
                      <span>·</span>
                      <span>{money(p.price_cents)}</span>
                      {p.refunded && (
                        <span className="badge border-red-500/40 text-red-500">
                          Refunded
                        </span>
                      )}
                      {isGhl && imp?.status === "imported" && (
                        <span className="badge border-emerald-500/40 text-emerald-500">
                          Imported to {imp.location_name}
                        </span>
                      )}
                      {refund && !p.refunded && (
                        <span
                          className={`badge ${
                            refund.status === "open"
                              ? "border-amber-500/40 text-amber-500"
                              : refund.status === "denied"
                                ? "border-red-500/40 text-red-500"
                                : "border-emerald-500/40 text-emerald-500"
                          }`}
                        >
                          Refund {refund.status} · {REFUND_REASON_LABELS[refund.reason_category]}
                        </span>
                      )}
                    </div>
                    {p.license_key && (
                      <p className="mt-2 text-xs">
                        <span className="text-faint">License key: </span>
                        <code className="text-accent bg-accent-soft/60 px-2 py-0.5 rounded">
                          {p.license_key}
                        </code>
                      </p>
                    )}
                  </div>
                  {!p.refunded && (
                    <div className="flex flex-wrap gap-2">
                      {isGhl ? (
                        imp && imp.status !== "imported" ? (
                          <button onClick={() => setGhlModal(p)} className="btn-primary">
                            ⚡ {imp.status === "awaiting_conflict_check" ? "Finish import" : "Review & import"}
                          </button>
                        ) : imp ? (
                          <button onClick={() => setGhlModal(p)} className="btn-ghost">
                            View import
                          </button>
                        ) : null
                      ) : (
                        <button onClick={() => setInstallModal(p)} className="btn-primary">
                          Install
                        </button>
                      )}
                      <div className="btn-ghost gap-0.5" title="Rate this asset">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => review(p, n)}
                            className="hover:text-amber-500 text-faint px-0.5"
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {!refund && (
                        <button onClick={() => setRefundModal(p)} className="btn-ghost">
                          Refund
                        </button>
                      )}
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
          <h2 className="text-xl font-semibold text-ink mb-4">Wishlist</h2>
          <div className="flex flex-wrap gap-2">
            {wishlist.map((w) => (
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

      {ghlModal && imports.get(ghlModal.order_item_id) && (
        <GhlImportFlow
          importRow={imports.get(ghlModal.order_item_id)!}
          title={ghlModal.title}
          onClose={() => setGhlModal(null)}
          onDone={load}
        />
      )}
      {installModal && (
        <DeliveryModal
          platform={installModal.platform}
          title={installModal.title}
          slug={installModal.slug}
          onDownload={() => download(installModal)}
          onClose={() => setInstallModal(null)}
        />
      )}
      {refundModal && (
        <RefundModal
          orderItemId={refundModal.order_item_id}
          title={refundModal.title}
          purchasedAt={refundModal.created_at}
          onClose={() => setRefundModal(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
