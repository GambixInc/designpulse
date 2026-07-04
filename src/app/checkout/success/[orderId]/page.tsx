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

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 grid place-items-center text-3xl mb-6">
        ✓
      </div>
      <h1 className="text-3xl font-bold text-white">Order confirmed</h1>
      <p className="mt-2 text-slate-400">
        Your license keys and download links are ready in your library. A receipt
        email is sent in production.
      </p>
      <div className="card p-5 mt-8 text-left">
        {(order.order_items ?? []).map((oi: any) => (
          <div key={oi.id} className="flex justify-between text-sm py-1.5">
            <span className="text-slate-300">
              {oi.assets?.title}{" "}
              <span className="text-slate-500 capitalize">({oi.license_tier})</span>
            </span>
            <span className="text-white">{money(oi.price_cents)}</span>
          </div>
        ))}
        <div className="border-t border-ink-700 mt-3 pt-3 flex justify-between text-sm font-bold">
          <span className="text-slate-400">Total</span>
          <span className="text-white">{money(order.total_cents)}</span>
        </div>
      </div>
      <Link href="/dashboard" className="btn-primary mt-8 px-8 py-3 text-base">
        Go to my library →
      </Link>
    </div>
  );
}
