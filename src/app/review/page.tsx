"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  money,
  dateFmt,
  businessDaysSince,
  REFUND_REASON_LABELS,
} from "@/lib/format";

/** Layer 2 rubric (PRD review module): five scored criteria. */
const RUBRIC: [string, string][] = [
  ["visual_design", "Visual design"],
  ["responsiveness", "Responsiveness"],
  ["code_quality", "Code quality"],
  ["documentation", "Documentation"],
  ["originality", "Originality"],
];

const SLA_TARGET_DAYS = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function SlaBadge({ submittedAt }: { submittedAt: string }) {
  const days = businessDaysSince(submittedAt);
  const cls =
    days > SLA_TARGET_DAYS
      ? "border-red-500/40 text-red-500"
      : days >= 3
        ? "border-amber-500/40 text-amber-500"
        : "border-emerald-500/40 text-emerald-500";
  const label =
    days > SLA_TARGET_DAYS
      ? `SLA overdue · ${days} business days`
      : `${days} business day${days === 1 ? "" : "s"} in queue (SLA 3–5)`;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ScoreDots({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`Score ${n}`}
          className={`h-6 w-6 rounded-full text-xs font-medium transition-colors ${
            n <= value ? "bg-accent text-white" : "bg-line text-muted hover:bg-faint/40"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function ReviewPanel({
  submission,
  onDone,
}: {
  submission: Row;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(RUBRIC.map(([k]) => [k, 4]))
  );
  const [sellerNote, setSellerNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (outcome: "pass" | "fail" | "revise") => {
    if (outcome !== "pass" && !sellerNote.trim()) {
      setError("Add feedback for the seller before rejecting or requesting revisions.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("review_submission", {
      p_submission_id: submission.id,
      p_outcome: outcome,
      p_notes: sellerNote,
      p_scores: scores,
      p_internal_note: internalNote || null,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      onDone();
    }
  };

  return (
    <div className="mt-4 border-t border-line pt-4 grid md:grid-cols-2 gap-6">
      <div>
        <p className="label">Scoring rubric (1–5)</p>
        <div className="space-y-3">
          {RUBRIC.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">{label}</span>
              <ScoreDots
                value={scores[key]}
                onChange={(n) => setScores((s) => ({ ...s, [key]: n }))}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Feedback to seller</label>
          <textarea
            className="input min-h-20"
            placeholder="Visible to the seller with the decision."
            value={sellerNote}
            onChange={(e) => setSellerNote(e.target.value)}
          />
        </div>
        <div>
          <label className="label">
            Internal note <span className="text-faint">(Gambix staff only — audit log)</span>
          </label>
          <textarea
            className="input min-h-16"
            placeholder="Never shown to the seller."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => decide("pass")} className="btn-primary">
            Approve
          </button>
          <button disabled={busy} onClick={() => decide("revise")} className="btn-ghost">
            Request revision
          </button>
          <button
            disabled={busy}
            onClick={() => decide("fail")}
            className="btn-ghost text-red-500 border-red-500/40"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function RefundTicket({ ticket, onDone }: { ticket: Row; onDone: () => void }) {
  const supabase = createClient();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proofs: string[] = ticket.proof_files ?? [];

  const resolve = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("resolve_refund", {
      p_refund_id: ticket.id,
      p_approve: approve,
      p_notes: notes,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    } else {
      onDone();
    }
  };

  const openProof = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("refund-proofs")
      .createSignedUrl(path, 3600);
    if (error) alert(error.message);
    else window.open(data.signedUrl, "_blank");
  };

  const item = ticket.order_items;
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-ink font-medium">
            {item?.assets?.title} — {money(item?.price_cents ?? 0)}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
            <span className="badge border-line text-muted">
              {REFUND_REASON_LABELS[ticket.reason_category] ?? ticket.reason_category}
            </span>
            {ticket.flagged_change_of_mind && (
              <span className="badge border-red-500/40 text-red-500">
                ⚑ Flagged — not a technical defect · deny by default
              </span>
            )}
            <span className="badge border-line text-faint">
              Requested {dateFmt(ticket.created_at)}
            </span>
          </div>
          <p className="text-sm text-muted mt-2">“{ticket.reason}”</p>
          {proofs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {proofs.map((p, i) => (
                <button
                  key={p}
                  onClick={() => openProof(p)}
                  className="text-xs text-accent hover:underline"
                >
                  View proof {i + 1} ↗
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-faint mt-2">
            On approval: auto-reversal of {money(item?.commission_cents ?? 0)} commission +{" "}
            {money(item?.seller_earnings_cents ?? 0)} seller payout · counts toward the
            seller&apos;s refund rate.
          </p>
        </div>
        <div className="w-full sm:w-64 space-y-2">
          <input
            className="input"
            placeholder="Decision notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => resolve(true)} className="btn-primary flex-1">
              Approve
            </button>
            <button disabled={busy} onClick={() => resolve(false)} className="btn-ghost flex-1">
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  submission_pass: "Approved submission",
  submission_fail: "Rejected submission",
  submission_revise: "Requested revision",
  refund_requested: "Refund requested",
  refund_approved: "Approved refund",
  refund_denied: "Denied refund",
};

export default function ReviewDeskPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"queue" | "refunds" | "audit">("queue");
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Row[]>([]);
  const [refunds, setRefunds] = useState<Row[]>([]);
  const [audit, setAudit] = useState<Row[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/review");
      return;
    }
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (me?.role !== "reviewer" && me?.role !== "admin") {
      router.push("/");
      return;
    }
    const [{ data: subs }, { data: refundRows }, { data: auditRows }] = await Promise.all([
      supabase
        .from("submissions")
        .select(
          "*, assets(title, slug, description), profiles!submissions_seller_id_fkey(full_name, email)"
        )
        .eq("outcome", "pending")
        .order("submitted_at"),
      supabase
        .from("refund_requests")
        .select(
          "*, order_items(price_cents, commission_cents, seller_earnings_cents, assets(title))"
        )
        .eq("status", "open")
        .order("created_at"),
      supabase
        .from("review_audit_log")
        .select("*, profiles!review_audit_log_actor_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setQueue(subs ?? []);
    setRefunds(refundRows ?? []);
    setAudit(auditRows ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return <p className="text-center py-24 text-muted">Loading review desk…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Review desk</h1>
      <p className="text-muted mb-7">
        Layer 2 human review — in-house Gambix staff only. SLA target: 3–5
        business days per submission.
      </p>

      <div className="flex gap-2 mb-6">
        {(
          [
            ["queue", `Submissions (${queue.length})`],
            ["refunds", `Refund tickets (${refunds.length})`],
            ["audit", "Audit log"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "btn-primary" : "btn-ghost"}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "queue" &&
        (queue.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            Review queue is clear. 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((s) => (
              <div key={s.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{s.assets?.title}</p>
                    <p className="text-xs text-faint mt-0.5">
                      by {s.profiles?.full_name ?? "Unknown"} ({s.profiles?.email}) ·
                      submitted {dateFmt(s.submitted_at)}
                    </p>
                    <p className="text-sm text-muted mt-2 max-w-2xl">
                      {s.assets?.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <SlaBadge submittedAt={s.submitted_at} />
                      {Object.entries(s.layer1_results ?? {}).map(([k, v]) => (
                        <span
                          key={k}
                          className={`badge ${v === "passed" ? "border-emerald-500/40 text-emerald-500" : "border-amber-500/40 text-amber-500"}`}
                        >
                          {k.replace(/_/g, " ")}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenId(openId === s.id ? null : s.id)}
                    className={openId === s.id ? "btn-ghost" : "btn-primary"}
                  >
                    {openId === s.id ? "Collapse" : "Start review"}
                  </button>
                </div>
                {openId === s.id && (
                  <ReviewPanel
                    submission={s}
                    onDone={() => {
                      setOpenId(null);
                      load();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

      {tab === "refunds" &&
        (refunds.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            No open refund tickets.
          </div>
        ) : (
          <div className="space-y-4">
            {refunds.map((r) => (
              <RefundTicket key={r.id} ticket={r} onDone={load} />
            ))}
          </div>
        ))}

      {tab === "audit" && (
        <div className="card divide-y divide-line">
          {audit.length === 0 && (
            <p className="p-10 text-center text-muted">No audit entries yet.</p>
          )}
          {audit.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <span className="text-faint whitespace-nowrap">
                {new Date(a.created_at).toLocaleString()}
              </span>
              <span className="font-medium text-ink">
                {a.profiles?.full_name ?? "System"}
              </span>
              <span className="badge border-line text-muted capitalize">{a.actor_role}</span>
              <span className="text-muted">{ACTION_LABELS[a.action] ?? a.action}</span>
              {a.details?.internal_note && (
                <span className="text-faint italic">“{a.details.internal_note}”</span>
              )}
              {a.details?.commission_reversed_cents != null && (
                <span className="text-faint">
                  reversed {money(a.details.commission_reversed_cents)} +{" "}
                  {money(a.details.payout_reversed_cents ?? 0)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
