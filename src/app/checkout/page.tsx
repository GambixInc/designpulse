"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, LICENSE_INFO } from "@/lib/format";

type LineItem = {
  license_id: string;
  tier: string;
  price_cents: number;
  title: string;
  platform: string;
};

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const licenseId = params.get("license");
  const [item, setItem] = useState<LineItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!licenseId) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/checkout?license=${licenseId}`)}`);
        return;
      }
      const { data } = await supabase
        .from("asset_licenses")
        .select("id, tier, price_cents, assets(title, categories(platform))")
        .eq("id", licenseId)
        .single();
      if (data) {
        const a: any = data.assets;
        setItem({
          license_id: data.id,
          tier: data.tier,
          price_cents: data.price_cents,
          title: a?.title ?? "",
          platform: a?.categories?.platform ?? "",
        });
      }
    })();
  }, [licenseId, router]);

  const pay = async () => {
    if (!item) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // Production: create Stripe Checkout Session here (destination charge,
    // 15% application_fee via Stripe Connect) and redirect to Stripe-hosted page.
    // MVP: server-side RPC validates prices and creates the order atomically.
    const { data, error } = await supabase.rpc("checkout", {
      p_license_ids: [item.license_id],
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      router.push(`/checkout/success/${data}`);
    }
  };

  if (!licenseId) return <p className="text-center py-20 text-slate-400">No item selected.</p>;
  if (!item) return <p className="text-center py-20 text-slate-400">Loading order…</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>
      <div className="card p-5 mb-5">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-white font-medium">{item.title}</p>
            <p className="text-slate-400 mt-0.5">{LICENSE_INFO[item.tier]?.label}</p>
          </div>
          <p className="text-pulse-400 font-bold">{money(item.price_cents)}</p>
        </div>
        <div className="border-t border-ink-700 mt-4 pt-4 flex justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="text-white font-bold">{money(item.price_cents)}</span>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Payment</h2>
          <span className="badge border-amber-500/40 text-amber-400">
            Simulated — no charge
          </span>
        </div>
        <div className="space-y-3 opacity-80">
          <div>
            <label className="label">Card number</label>
            <input className="input" defaultValue="4242 4242 4242 4242" readOnly />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Expiry</label>
              <input className="input" defaultValue="12/29" readOnly />
            </div>
            <div>
              <label className="label">CVC</label>
              <input className="input" defaultValue="424" readOnly />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        <button onClick={pay} disabled={busy} className="btn-primary w-full mt-5 py-3">
          {busy ? "Processing…" : `Pay ${money(item.price_cents)}`}
        </button>
        <p className="mt-3 text-xs text-slate-500 text-center">
          In production this is a Stripe-hosted checkout. The buyer pays the full
          price; Stripe routes 85% to the seller and retains Gambix's 15% fee.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
