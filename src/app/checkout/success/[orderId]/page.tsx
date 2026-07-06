import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: { orderId: string };
}) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, created_at, order_items(id, license_tier, price_cents, assets(title))")
    .eq("id", params.orderId)
    .single();

  if (!order) notFound();

  const itemIds = (order.order_items ?? []).map((oi: { id: string }) => oi.id);
  const { count: pendingImports } = await supabase
    .from("ghl_imports")
    .select("id", { count: "exact", head: true })
    .in("order_item_id", itemIds)
    .neq("status", "imported");

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 grid place-items-center text-3xl mb-6">
        ✓
      </div>
      <h1 className="text-3xl font-bold text-ink">Order confirmed</h1>
      <p className="mt-2 text-muted">
        Your license keys and download links are ready in your library. A receipt
        email is sent in production.
      </p>
      <div className="card p-5 mt-8 text-left">
        {(order.order_items ?? []).map((oi: any) => (
          <div key={oi.id} className="flex justify-between text-sm py-1.5">
            <span className="text-muted">
              {oi.assets?.title}{" "}
              <span className="text-faint capitalize">({oi.license_tier})</span>
            </span>
            <span className="text-ink">{money(oi.price_cents)}</span>
          </div>
        ))}
        <div className="border-t border-line mt-3 pt-3 flex justify-between text-sm font-bold">
          <span className="text-muted">Total</span>
          <span className="text-ink">{money(order.total_cents)}</span>
        </div>
      </div>
      {(pendingImports ?? 0) > 0 && (
        <div className="card p-4 mt-5 text-sm text-left flex gap-3 items-start border-accent/40">
          <span className="text-accent text-lg leading-none">⚡</span>
          <p className="text-muted">
            <span className="text-ink font-medium">One more step for your GHL snapshot:</span>{" "}
            run the conflict check and confirm the import from your library. Your
            sub-account is already connected.
          </p>
        </div>
      )}
      <Link href="/dashboard" className="btn-primary mt-8 px-8 py-3 text-base">
        {(pendingImports ?? 0) > 0 ? "Finish import in my library →" : "Go to my library →"}
      </Link>
    </div>
  );
}
