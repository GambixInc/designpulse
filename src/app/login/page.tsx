"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_ACCOUNTS = [
  { label: "Demo buyer", email: "buyer@designpulse.demo", hint: "Browse, buy, download" },
  { label: "Demo seller", email: "seller@designpulse.demo", hint: "Upload & track sales" },
  { label: "Demo reviewer", email: "reviewer@designpulse.demo", hint: "Review desk & refund tickets" },
  { label: "Demo admin", email: "admin@designpulse.demo", hint: "Sellers, catalog & analytics" },
];
const DEMO_PASSWORD = "designpulse-demo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (e?: React.FormEvent, demoEmail?: string) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const creds = demoEmail
      ? { email: demoEmail, password: DEMO_PASSWORD }
      : { email, password };

    if (mode === "signup" && !demoEmail) {
      const { data, error } = await supabase.auth.signUp({
        ...creds,
        options: { data: { full_name: name } },
      });
      if (error) setError(error.message);
      else if (!data.session)
        setNotice("Check your email to confirm your account, then sign in.");
      else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) setError(error.message);
      else {
        router.push(next);
        router.refresh();
      }
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold text-ink text-center">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="text-center text-muted text-sm mt-2 mb-8">
        {mode === "signin"
          ? "Sign in to access your library and licenses."
          : "Join DesignPulse to buy and sell premium design assets."}
      </p>

      <form onSubmit={go} className="card p-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {notice && <p className="text-sm text-emerald-500">{notice}</p>}
        <button disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-center text-sm text-faint">
          {mode === "signin" ? "No account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>

      <div className="mt-6">
        <p className="text-center text-xs uppercase tracking-widest text-faint mb-3">
          Or explore with a demo account
        </p>
        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.email}
              disabled={busy}
              onClick={() => go(undefined, d.email)}
              className="btn-ghost justify-between"
            >
              <span>{d.label}</span>
              <span className="text-xs text-faint">{d.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
