"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type GhlImportRow = {
  id: string;
  status: string;
  conflicts: { type: string; severity: string; message: string }[];
  components: string[];
  location_name: string;
};

const COMPONENT_OPTIONS: { key: string; label: string }[] = [
  { key: "funnels", label: "Funnels & pages" },
  { key: "workflows", label: "Workflows & automations" },
  { key: "pipelines", label: "Pipelines" },
  { key: "custom_values", label: "Custom values & fields" },
];

/**
 * Post-purchase GHL snapshot push (PRD §8): the sub-account was connected via
 * OAuth at checkout; here we run conflict detection, let the buyer confirm,
 * then load the snapshot (simulated Snapshot Load API).
 */
export default function GhlImportFlow({
  importRow,
  title,
  onClose,
  onDone,
}: {
  importRow: GhlImportRow;
  title: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [status, setStatus] = useState(importRow.status);
  const [conflicts, setConflicts] = useState(importRow.conflicts ?? []);
  const [selected, setSelected] = useState<string[]>(
    importRow.components?.length ? importRow.components : COMPONENT_OPTIONS.map((c) => c.key)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("run_ghl_conflict_check", {
      p_import_id: importRow.id,
    });
    if (error) setError(error.message);
    else {
      const found = (data ?? []) as typeof conflicts;
      setConflicts(found);
      setStatus(found.length > 0 ? "conflicts_found" : "ready_to_import");
    }
    setBusy(false);
  };

  const confirmImport = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("confirm_ghl_import", {
      p_import_id: importRow.id,
      p_components: selected,
    });
    if (error) setError(error.message);
    else setStatus("imported");
    setBusy(false);
  };

  const toggle = (key: string) =>
    setSelected((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <div className="card p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-ink">Import “{title}”</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">✕</button>
        </div>
        <p className="text-xs text-muted mb-5">
          Target sub-account: <span className="text-ink">{importRow.location_name}</span>{" "}
          (connected via OAuth at checkout)
        </p>

        {status === "awaiting_conflict_check" && (
          <>
            <p className="text-sm text-muted mb-4">
              Before pushing this snapshot, we check the sub-account for existing
              funnels, workflows, pipelines, or custom values it could overwrite.
            </p>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <button onClick={runCheck} disabled={busy} className="btn-primary w-full">
              {busy ? "Scanning sub-account…" : "Run conflict check"}
            </button>
          </>
        )}

        {(status === "conflicts_found" || status === "ready_to_import") && (
          <>
            {conflicts.length > 0 ? (
              <div className="space-y-2 mb-4">
                {conflicts.map((c, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 text-sm ${
                      c.severity === "high"
                        ? "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400"
                        : "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <p className="font-medium capitalize">
                      {c.severity} · {c.type.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 opacity-90">{c.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-500 mb-4">
                ✓ Conflict check passed — no existing assets will be overwritten.
              </p>
            )}

            <p className="label">Components to import</p>
            <div className="space-y-2 mb-4 text-sm">
              {COMPONENT_OPTIONS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-ink">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.key)}
                    onChange={() => toggle(c.key)}
                    className="accent-accent"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <button
              onClick={confirmImport}
              disabled={busy || selected.length === 0}
              className="btn-primary w-full"
            >
              {busy
                ? "Importing…"
                : conflicts.length > 0
                  ? "Import anyway (I understand the conflicts)"
                  : "Confirm import"}
            </button>
          </>
        )}

        {status === "imported" && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-ink font-medium">Snapshot imported</p>
            <p className="text-sm text-muted mt-1">
              Loaded into {importRow.location_name} via the GHL Snapshot API
              (<code className="text-xs">POST /v1/locations/{"{id}"}/snapshots/load</code>).
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
        )}
      </div>
    </div>
  );
}
