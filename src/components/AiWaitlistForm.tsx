"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AI_LINES, WAITLIST_ROLES, WAITLIST_TRADES } from "@/lib/ai-hub";

type Fields = { email: string; role: string; trade: string; interest: string };

const INITIAL: Fields = { email: "", role: "agency", trade: "Restoration", interest: "front_desk" };

/** Postgres unique_violation: this email is already on the list for this line. */
const DUPLICATE = "23505";

export default function AiWaitlistForm() {
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [state, setState] = useState<"idle" | "busy" | "joined" | "already">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof Fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    setError(null);
    const { error } = await createClient()
      .from("ai_waitlist")
      .insert({ ...fields, email: fields.email.trim().toLowerCase() });
    if (!error) return setState("joined");
    if (error.code === DUPLICATE) return setState("already");
    setError("That did not go through. Check the email address and try again.");
    setState("idle");
  };

  if (state === "joined" || state === "already") {
    return (
      <div className="card p-6 text-center" role="status">
        <p className="font-semibold text-ink">
          {state === "joined" ? "You’re on the list." : "You’re already on the list for this one."}
        </p>
        <p className="mt-1 text-sm text-muted">We’ll email you once, when it opens.</p>
      </div>
    );
  }

  return (
    <form onSubmit={join} className="card p-6 grid gap-4 sm:grid-cols-2">
      <Field label="Work email" className="sm:col-span-2">
        <input type="email" required maxLength={254} className="input" value={fields.email}
          onChange={(e) => set("email")(e.target.value)} />
      </Field>
      <Select label="I am" value={fields.role} onChange={set("role")} options={WAITLIST_ROLES} />
      <Select label="Trade" value={fields.trade} onChange={set("trade")}
        options={WAITLIST_TRADES.map((t): [string, string] => [t, t])} />
      <Select label="Most interested in" value={fields.interest} onChange={set("interest")}
        options={AI_LINES.map((l): [string, string] => [l.id, l.name])} className="sm:col-span-2" />
      {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}
      <div className="sm:col-span-2">
        <button disabled={state === "busy"} className="btn-primary w-full py-3">
          {state === "busy" ? "Joining…" : "Get early access"}
        </button>
        <p className="mt-2 text-xs text-faint text-center">
          One email when it launches, nothing else. See our{" "}
          <Link href="/legal/privacy" className="text-accent hover:underline">privacy policy</Link>.
        </p>
      </div>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  className?: string;
};

function Select({ label, value, onChange, options, className }: SelectProps) {
  return (
    <Field label={label} className={className}>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </Field>
  );
}
