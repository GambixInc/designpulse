"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REFUND_REASONS, REFUND_WINDOW_DAYS, refundDaysLeft } from "@/lib/format";

/**
 * Structured refund ticket (PRD refund module): reason dropdown + defect proof
 * upload, routed to the in-house review team. The 7-day window and the
 * change-of-mind flag are enforced server-side in request_refund().
 */
export default function RefundModal({
  orderItemId,
  title,
  purchasedAt,
  onClose,
  onDone,
}: {
  orderItemId: string;
  title: string;
  purchasedAt: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const daysLeft = refundDaysLeft(purchasedAt);
  const [reason, setReason] = useState(REFUND_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isDefect = REFUND_REASONS.find((r) => r.value === reason)?.defect ?? false;
  const expired = daysLeft <= 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const proofPaths: string[] = [];
      for (const file of files.slice(0, 5)) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("refund-proofs")
          .upload(path, file);
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
        proofPaths.push(path);
      }

      const { error: rpcErr } = await supabase.rpc("request_refund", {
        p_order_item_id: orderItemId,
        p_reason_category: reason,
        p_details: details,
        p_proof_files: proofPaths,
      });
      if (rpcErr) throw new Error(rpcErr.message);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <div className="card p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-ink">Refund request — {title}</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">✕</button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="text-emerald-500 font-medium">✓ Request submitted</p>
            <p className="mt-2 text-sm text-muted">
              Gambix&apos;s in-house review team will verify the defect and
              respond. Approved refunds automatically reverse the seller payout
              and platform commission.
            </p>
            <button
              onClick={() => {
                onDone();
                onClose();
              }}
              className="btn-ghost mt-5 w-full"
            >
              Close
            </button>
          </div>
        ) : expired ? (
          <p className="text-sm text-muted py-3">
            The {REFUND_WINDOW_DAYS}-day refund window for this purchase has
            closed. The window is enforced automatically and starts on the
            purchase date.
          </p>
        ) : (
          <>
            <p className="badge border-accent/40 text-accent mb-4">
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left in the {REFUND_WINDOW_DAYS}-day window
            </p>

            <label className="label">Reason</label>
            <select
              className="input mb-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REFUND_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {!isDefect && (
              <p className="text-xs text-amber-500 mb-3">
                Refunds cover verifiable technical defects only — this reason
                will be flagged and is denied by default.
              </p>
            )}

            <label className="label mt-3">Describe the defect</label>
            <textarea
              className="input min-h-24"
              placeholder="What's broken? Include steps to reproduce (min. 20 characters)."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <label className="label mt-3">Proof (screenshots / files)</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.log"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-muted file:mr-3 file:btn-ghost file:border-line"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-faint">
                {files.length} file{files.length === 1 ? "" : "s"} attached
              </p>
            )}

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <button
              onClick={submit}
              disabled={busy || details.trim().length < 20}
              className="btn-primary w-full mt-5"
            >
              {busy ? "Submitting…" : "Submit refund request"}
            </button>
            <p className="mt-3 text-xs text-faint text-center">
              Reviewed by Gambix staff — not auto-approved. Decisions typically
              land within 3–5 business days.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
