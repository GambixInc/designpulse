"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { money, LICENSE_INFO } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

type License = { id: string; tier: string; price_cents: number };

export default function BuyBox({
  licenses,
  isGhl,
  signedIn,
  slug,
}: {
  assetId: string;
  licenses: License[];
  isGhl: boolean;
  signedIn: boolean;
  slug: string;
}) {
  const sorted = [...licenses].sort((a, b) => a.price_cents - b.price_cents);
  const [selected, setSelected] = useState<string>(sorted[0]?.id);
  const [wishing, setWishing] = useState(false);
  const [wished, setWished] = useState(false);
  const router = useRouter();

  const buy = () => {
    const target = `/checkout?license=${selected}`;
    router.push(signedIn ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  const wishlist = async () => {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/asset/${slug}`)}`);
      return;
    }
    setWishing(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: asset } = await supabase
      .from("assets")
      .select("id")
      .eq("slug", slug)
      .single();
    if (user && asset) {
      await supabase
        .from("wishlists")
        .upsert({ buyer_id: user.id, asset_id: asset.id });
      setWished(true);
    }
    setWishing(false);
  };

  return (
    <div className="card p-5 sticky top-24">
      <h2 className="font-semibold text-ink mb-4">Choose a license</h2>
      <div className="space-y-3">
        {sorted.map((l) => {
          const info = LICENSE_INFO[l.tier];
          return (
            <label
              key={l.id}
              className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                selected === l.id
                  ? "border-accent bg-accent-soft/60"
                  : "border-line hover:border-faint"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={selected === l.id}
                onChange={() => setSelected(l.id)}
              />
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{info.label}</span>
                <span className="text-ink font-bold">{money(l.price_cents)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{info.desc}</p>
            </label>
          );
        })}
      </div>
      <button onClick={buy} className="btn-primary w-full mt-4 py-3 text-base">
        Buy now
      </button>
      <button
        onClick={wishlist}
        disabled={wishing || wished}
        className="btn-ghost w-full mt-2"
      >
        {wished ? "♥ In wishlist" : "♡ Add to wishlist"}
      </button>
      <ul className="mt-4 space-y-1.5 text-xs text-faint">
        {isGhl ? (
          <>
            <li>⚡ Pushed into your GHL sub-account via the Snapshot API</li>
            <li>🔗 GHL OAuth connection required at checkout</li>
          </>
        ) : (
          <li>⬇ Instant delivery via secure 72-hour tokenized link</li>
        )}
        <li>🔑 Unique license key issued per purchase</li>
        <li>↩ 7-day refund window for verifiable technical defects</li>
        <li>💳 Checkout simulated in this MVP (Stripe Connect in production)</li>
      </ul>
    </div>
  );
}
