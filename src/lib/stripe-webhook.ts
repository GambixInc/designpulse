import { createHmac, timingSafeEqual } from "crypto";

/** Stripe's own default: reject events signed more than five minutes ago. */
const TOLERANCE_SECONDS = 300;

export type StripeCheckoutEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      client_reference_id?: string | null;
      metadata?: Record<string, string> | null;
    };
  };
};

function parseHeader(header: string): { timestamp: string | null; signatures: string[] } {
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }
  return { timestamp, signatures };
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Checks the `Stripe-Signature` header against the raw request body. */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowMs: number = Date.now()
): boolean {
  if (!header) return false;
  const { timestamp, signatures } = parseHeader(header);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(nowMs / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return signatures.some((sig) => safeEqual(sig, expected));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The DesignPulse checkout id carried on a Checkout Session, or null when the
 * session belongs to something else on the same Stripe account.
 */
export function checkoutIdFrom(event: StripeCheckoutEvent): string | null {
  const session = event.data.object;
  const id = session.metadata?.checkout_id ?? null;
  if (!id || !UUID.test(id) || session.client_reference_id !== id) return null;
  return id;
}
