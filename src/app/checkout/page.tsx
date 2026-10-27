"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, LICENSE_INFO, REFUND_WINDOW_DAYS } from "@/lib/format";
import { LEGAL } from "@/lib/legal";

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

const CHECKOUT_ERRORS: [string, string][] = [
  ["STRIPE_NOT_CONFIGURED", "Payments are not switched on yet. Please check back soon."],
  ["THIRD_PARTY_UNAVAILABLE", "Items from marketplace sellers are not on sale yet."],
  ["GHL_OAUTH_REQUIRED", "Connect your Go High Level sub-account above to complete this purchase."],
  ["TERMS_REQUIRED", "Please accept the Terms of Sale to continue."],
  ["STRIPE_ERROR", "Our payment provider could not start checkout. Please try again in a minute."],
];

function checkoutErrorMessage(message: string): string {
  return CHECKOUT_ERRORS.find(([code]) => message.startsWith(code))?.[1] ?? message;
}

type StripePayCardProps = {
  licenseId: string;
  totalCents: number;
  ghlConnectionId: string | null;
  disabled: boolean;
  isGhl: boolean;
};

/**
 * Hands the buyer to Stripe-hosted Checkout. start_checkout prices the cart in
 * Postgres and records which Terms version the buyer accepted; the browser
 * only sends license ids.
 */
function StripePayCard(props: StripePayCardProps) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const { data, error } = await createClient().rpc("start_checkout", {
      p_license_ids: [props.licenseId],
      p_ghl_connection_id: props.ghlConnectionId,
      p_origin: window.location.origin,
      p_terms_version: LEGAL.termsVersion,
    });
    if (error || typeof data !== "string") {
      setError(checkoutErrorMessage(error?.message ?? "Checkout could not start."));
      setBusy(false);
      return;
    }
    window.location.assign(data);
  };

  return (
    <div className={`card p-5 ${props.disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink">Payment</h2>
        <span className="badge border-line text-muted">Secure checkout by Stripe</span>
      </div>
      <TermsConsent checked={agreed} onChange={setAgreed} />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        onClick={pay}
        disabled={busy || props.disabled || !agreed}
        className="btn-primary w-full mt-5 py-3"
      >
        {busy ? "Opening secure checkout…" : `Pay ${money(props.totalCents)}`}
      </button>
      <p className="mt-3 text-xs text-faint text-center">
        {props.isGhl
          ? "You pay on Stripe's secure page; the snapshot import starts once payment clears."
          : "You pay on Stripe's secure page. Card details never reach DesignPulse."}
      </p>
    </div>
  );
}

function TermsConsent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex gap-3 items-start text-sm text-muted cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-accent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        I agree to the{" "}
        <Link href="/legal/terms" target="_blank" className="text-accent hover:underline">
          Terms of Sale
        </Link>{" "}
        and{" "}
        <Link href="/legal/license" target="_blank" className="text-accent hover:underline">
          License
        </Link>
        . I ask for immediate access to this digital product and understand that
        once delivery starts I lose any statutory right to cancel; the{" "}
        <Link href="/legal/refunds" target="_blank" className="text-accent hover:underline">
          {REFUND_WINDOW_DAYS}-day defect refund policy
        </Link>{" "}
        still applies.
      </span>
    </label>
  );
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const licenseId = params.get("license");
  const canceled = params.get("canceled") === "1";
  const [item, setItem] = useState<LineItem | null>(null);
  const [connections, setConnections] = useState<GhlConnection[]>([]);
  const [ghlConnectionId, setGhlConnectionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      const [{ data, error }, { data: conns }] = await Promise.all([
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
      if (error || !data) {
        setLoadError("This item is not available to buy right now.");
        return;
      }
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
      setConnections((conns as GhlConnection[]) ?? []);
    })();
  }, [licenseId, router]);

  const isGhl = item?.platform === "ghl";
  const ghlSatisfied = !isGhl || !!ghlConnectionId;
  const connectedName =
    connections.find((c) => c.id === ghlConnectionId)?.location_name ??
    "Connected sub-account";

  if (!licenseId) return <p className="text-center py-20 text-muted">No item selected.</p>;
  if (loadError) return <p className="text-center py-20 text-muted">{loadError}</p>;
  if (!item) return <p className="text-center py-20 text-muted">Loading order…</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-14">
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-6">Checkout</h1>
      {canceled && (
        <p className="card p-4 mb-5 text-sm text-muted">
          Payment canceled. You have not been charged.
        </p>
      )}
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

      <StripePayCard
        licenseId={item.license_id}
        totalCents={item.price_cents}
        ghlConnectionId={ghlConnectionId}
        disabled={!ghlSatisfied}
        isGhl={isGhl}
      />
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
