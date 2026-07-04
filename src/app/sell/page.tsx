"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLATFORM_META } from "@/lib/format";

export default function SellPage() {
  const router = useRouter();
  const supabase = createClient();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [existing, setExisting] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(!!user);
      if (user) {
        const { data } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setExisting(data);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (p: string) =>
    setSpecialties((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("apply_as_seller", {
      p_display_name: displayName,
      p_bio: bio,
      p_portfolio_url: portfolio,
      p_specialties: specialties,
    });
    setBusy(false);
    if (error) alert(error.message);
    else setDone(true);
  };

  if (existing?.application_status === "approved") {
    router.push("/sell/dashboard");
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">Sell on DesignPulse</h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto">
          Keep 85% of every sale — flat 15% commission, paid out via Stripe
          Express. Quality review in 3–5 business days. Trusted sellers get
          expedited review; exclusive sellers earn reduced commission.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10 text-sm">
        {[
          ["1. Apply", "Share your portfolio and platform specialties."],
          ["2. Get reviewed", "Our team vets your work against a documented rubric."],
          ["3. Start earning", "Stripe Express handles KYC and payouts (7–14 day rolling)."],
        ].map(([t, d]) => (
          <div key={t} className="card p-4">
            <p className="font-semibold text-white">{t}</p>
            <p className="text-slate-400 mt-1">{d}</p>
          </div>
        ))}
      </div>

      {signedIn === false && (
        <div className="card p-8 text-center">
          <p className="text-slate-300 mb-4">Sign in to start your seller application.</p>
          <a href="/login?next=/sell" className="btn-primary">Sign in</a>
        </div>
      )}

      {signedIn && existing && existing.application_status === "pending" && !done && (
        <div className="card p-8 text-center">
          <p className="text-amber-400 font-medium">Application under review</p>
          <p className="text-slate-400 text-sm mt-2">
            We review applications within 3–5 business days. You'll get seller
            access as soon as you're approved.
          </p>
        </div>
      )}

      {done && (
        <div className="card p-8 text-center">
          <p className="text-emerald-400 font-medium">Application submitted ✓</p>
          <p className="text-slate-400 text-sm mt-2">
            Next step in production: Stripe Express onboarding (identity + bank
            details, handled by Stripe). Our team will review within 3–5 business days.
          </p>
        </div>
      )}

      {signedIn && !existing && !done && (
        <form onSubmit={apply} className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Seller application</h2>
          <div>
            <label className="label">Store / display name</label>
            <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell buyers what you build…" />
          </div>
          <div>
            <label className="label">Portfolio URL</label>
            <input type="url" className="input" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://…" required />
          </div>
          <div>
            <label className="label">Platform specialties</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLATFORM_META).map(([key, meta]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggle(key)}
                  className={`badge cursor-pointer ${specialties.includes(key) ? "border-pulse-500 text-pulse-400" : "border-ink-600 text-slate-400"}`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Business/tax info + identity verification are collected by Stripe
            Express during onboarding (not stored by DesignPulse).
          </p>
          <button disabled={busy || specialties.length === 0} className="btn-primary w-full py-2.5">
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </form>
      )}
    </div>
  );
}
