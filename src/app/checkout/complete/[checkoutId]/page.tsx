"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Stripe usually confirms card payments within a second or two. */
const POLL_MS = 2500;
const MAX_ATTEMPTS = 12;

type Phase = "confirming" | "pending" | "expired" | "error";

const MESSAGES: Record<Exclude<Phase, "confirming">, { title: string; body: string }> = {
  pending: {
    title: "Payment still processing",
    body: "Stripe has not confirmed the payment yet. Your purchase appears in your library as soon as it does, and you can safely close this page.",
  },
  expired: {
    title: "Checkout expired",
    body: "This checkout session expired before payment was completed. You have not been charged.",
  },
  error: {
    title: "We could not confirm your payment",
    body: "If you were charged, your purchase will still reach your library once Stripe confirms it. Contact support if it has not appeared within an hour.",
  },
};

async function checkStatus(checkoutId: string): Promise<{ orderId: string | null; phase: Phase }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fulfill_checkout", { p_checkout_id: checkoutId });
  if (error) return { orderId: null, phase: "error" };
  if (typeof data === "string") return { orderId: data, phase: "confirming" };
  const { data: row } = await supabase
    .from("stripe_checkouts")
    .select("status")
    .eq("id", checkoutId)
    .maybeSingle();
  return { orderId: null, phase: row?.status === "expired" ? "expired" : "confirming" };
}

/**
 * Stripe redirects here after payment. fulfill_checkout asks Stripe whether
 * the session is paid and creates the order; the webhook does the same if the
 * buyer never comes back.
 */
export default function CheckoutCompletePage({ params }: { params: { checkoutId: string } }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("confirming");

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      attempts += 1;
      const result = await checkStatus(params.checkoutId);
      if (result.orderId) return router.replace(`/checkout/success/${result.orderId}`);
      if (result.phase !== "confirming") return setPhase(result.phase);
      if (attempts >= MAX_ATTEMPTS) return setPhase("pending");
      timer = setTimeout(tick, POLL_MS);
    };
    tick().catch(() => setPhase("error"));
    return () => clearTimeout(timer);
  }, [params.checkoutId, router]);

  if (phase === "confirming") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-line border-t-accent animate-spin" />
        <h1 className="mt-6 text-2xl font-bold text-ink">Confirming your payment…</h1>
        <p className="mt-2 text-muted">This usually takes a few seconds.</p>
      </div>
    );
  }

  const message = MESSAGES[phase];
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">{message.title}</h1>
      <p className="mt-3 text-muted">{message.body}</p>
      <Link href="/dashboard" className="btn-primary mt-8 px-8 py-3">
        Go to my library
      </Link>
    </div>
  );
}
