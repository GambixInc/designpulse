import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import {
  checkoutIdFrom,
  verifyStripeSignature,
  type StripeCheckoutEvent,
} from "@/lib/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
]);

/**
 * Backup path for fulfillment when the buyer closes the tab before Stripe
 * redirects back. The webhook carries no authority of its own:
 * fulfill_checkout re-reads the session from Stripe before creating an order,
 * so it runs with the public anon key.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeCheckoutEvent;
  const checkoutId = HANDLED.has(event.type) ? checkoutIdFrom(event) : null;
  if (!checkoutId) return NextResponse.json({ received: true });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.rpc("fulfill_checkout", { p_checkout_id: checkoutId });
  if (error) {
    // A 500 makes Stripe retry with backoff for up to three days.
    console.error("fulfill_checkout failed", event.id, error.message);
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
