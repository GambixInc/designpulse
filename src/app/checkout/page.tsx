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

type GhlConnection = {
  id: string;
  location_id: string;
  location_name: string;
};

const OAUTH_SCOPES = [
  "View your sub-account profile",
  "Load snapshots into the sub-account",
  "Create funnels, workflows, and pipelines from the snapshot",
];

/**
 * Simulated GHL OAuth consent step. Production redirects to GHL's authorize URL
 * and exchanges the code server-side; connect_ghl_account stands in for the
 * token exchange. Checkout cannot proceed for GHL items without a connection —
 * the checkout RPC enforces the same rule server-side.
 */
function GhlOAuthStep({
  connections,
  onConnected,
}: {
  connections: GhlConnection[];
  onConnected: (id: string) => void;
}) {
  const [locationName, setLocationName] = useState("Main Agency Account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorize = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("connect_ghl_account", {
      p_location_name: locationName,
    });
    if (error) setError(error.message);
    else onConnected(data as string);
    setBusy(false);
  };

  return (
    <div className="card p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-ink">Connect Go High Level</h2>
        <span className="badge border-accent/40 text-accent">Required</span>
      </div>
      <p className="text-sm text-muted mb-4">
        This snapshot is delivered by API directly into your GHL sub-account, so
        an OAuth connection is required before payment.
      </p>

      {connections.length > 0 && (
        <div className="mb-4">
          <p className="label">Use an already-connected sub-account</p>
          <div className="space-y-2">
            {connections.map((c) => (
              <button
                key={c.id}
                onClick={() => onConnected(c.id)}
                className="btn-ghost w-full justify-between"
              >
                <span>{c.location_name}</span>
                <span className="text-xs text-faint">{c.location_id}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-faint my-3">— or connect a new one —</p>
        </div>
      )}

      <div className="rounded-xl border border-line p-4 bg-canvas">
        <p className="text-xs uppercase tracking-wider text-faint mb-2">
          OAuth consent · DesignPulse is requesting
        </p>
        <ul className="space-y-1.5 text-sm text-ink mb-4">
          {OAUTH_SCOPES.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-accent">•</span> {s}
            </li>
          ))}
        </ul>
        <label className="label">Sub-account (location)</label>
        <select
          className="input mb-4"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        >
          <option>Main Agency Account</option>
          <option>Client — Acme Dental</option>
          <option>Client — Peak Fitness</option>
          <option>Client — Harbor Realty</option>
        </select>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button onClick={authorize} disabled={busy} className="btn-primary w-full">
          {busy ? "Authorizing…" : "Authorize DesignPulse (simulated OAuth)"}
        </button>
      </div>
    </div>
  );
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const licenseId = params.get("license");
  const [item, setItem] = useState<LineItem | null>(null);
  const [connections, setConnections] = useState<GhlConnection[]>([]);
  const [ghlConnectionId, setGhlConnectionId] = useState<string | null>(null);
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
      const [{ data }, { data: conns }] = await Promise.all([
        supabase
          .from("asset_licenses")
          .select("id, tier, price_cents, assets(title, categories(platform))")
          .eq("id", licenseId)
          .single(),
        supabase
          .from("ghl_connections")
          .select("id, location_id, location_name")
          .eq("status", "active")
          .order("connected_at", { ascending: false }),
      ]);
      if (data) {
        const a = data.assets as unknown as {
          title?: string;
          categories?: { platform?: string };
        } | null;
        setItem({
          license_id: data.id,
          tier: data.tier,
          price_cents: data.price_cents,
          title: a?.title ?? "",
          platform: a?.categories?.platform ?? "",
        });
      }
      setConnections((conns as GhlConnection[]) ?? []);
    })();
  }, [licenseId, router]);

  const isGhl = item?.platform === "ghl";
  const ghlSatisfied = !isGhl || !!ghlConnectionId;
  const connectedName =
    connections.find((c) => c.id === ghlConnectionId)?.location_name ??
    "Connected sub-account";

  const pay = async () => {
    if (!item || !ghlSatisfied) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    // Production: create Stripe Checkout Session here (destination charge,
    // 15% application_fee via Stripe Connect) and redirect to Stripe-hosted page.
    // MVP: server-side RPC validates prices, the GHL OAuth gate, and creates
    // the order atomically.
    const { data, error } = await supabase.rpc("checkout", {
      p_license_ids: [item.license_id],
      p_ghl_connection_id: ghlConnectionId,
    });
    if (error) {
      setError(
        error.message.startsWith("GHL_OAUTH_REQUIRED")
          ? "Connect your Go High Level sub-account above to complete this purchase."
          : error.message
      );
      setBusy(false);
    } else {
      router.push(`/checkout/success/${data}`);
    }
  };

  if (!licenseId) return <p className="text-center py-20 text-muted">No item selected.</p>;
  if (!item) return <p className="text-center py-20 text-muted">Loading order…</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-6">Checkout</h1>
      <div className="card p-5 mb-5">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-ink font-medium">{item.title}</p>
            <p className="text-muted mt-0.5">{LICENSE_INFO[item.tier]?.label}</p>
          </div>
          <p className="text-ink font-bold">{money(item.price_cents)}</p>
        </div>
        <div className="border-t border-line mt-4 pt-4 flex justify-between text-sm">
          <span className="text-muted">Total</span>
          <span className="text-ink font-bold">{money(item.price_cents)}</span>
        </div>
      </div>

      {isGhl &&
        (ghlConnectionId ? (
          <div className="card p-4 mb-5 flex items-center justify-between text-sm">
            <span className="text-emerald-500">✓ GHL connected — {connectedName}</span>
            <button
              onClick={() => setGhlConnectionId(null)}
              className="text-muted hover:text-ink text-xs"
            >
              Change
            </button>
          </div>
        ) : (
          <GhlOAuthStep connections={connections} onConnected={setGhlConnectionId} />
        ))}

      <div className={`card p-5 ${ghlSatisfied ? "" : "opacity-50 pointer-events-none"}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Payment</h2>
          <span className="badge border-amber-500/40 text-amber-500">
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
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <button
          onClick={pay}
          disabled={busy || !ghlSatisfied}
          className="btn-primary w-full mt-5 py-3"
        >
          {busy ? "Processing…" : `Pay ${money(item.price_cents)}`}
        </button>
        <p className="mt-3 text-xs text-faint text-center">
          {isGhl
            ? "After payment the snapshot import starts automatically — finish the conflict check in your library."
            : "In production this is a Stripe-hosted checkout. The buyer pays the full price; Stripe routes 85% to the seller and retains Gambix's 15% fee."}
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
