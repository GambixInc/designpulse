"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [features, setFeatures] = useState("");
  const [platformVersion, setPlatformVersion] = useState("");
  const [dependencies, setDependencies] = useState("");
  const [priceStd, setPriceStd] = useState("49");
  const [priceExt, setPriceExt] = useState("149");
  const [demoUrl, setDemoUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/sell/upload");
        return;
      }
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("phase", 1)
        .order("id");
      setCategories(data ?? []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const slug =
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
      "-" +
      Math.random().toString(36).slice(2, 6);

    const { data: asset, error: aErr } = await supabase
      .from("assets")
      .insert({
        seller_id: user!.id,
        category_id: Number(categoryId),
        title,
        slug,
        description,
        features: features.split("\n").map((f) => f.trim()).filter(Boolean),
        compatibility: {
          platform_version: platformVersion,
          dependencies: dependencies.split(",").map((d) => d.trim()).filter(Boolean),
          package_file: fileName ?? "pending-upload.zip",
        },
        demo_url: demoUrl || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (aErr || !asset) {
      setError(aErr?.message ?? "Failed to create asset");
      setBusy(false);
      return;
    }

    const { error: lErr } = await supabase.from("asset_licenses").insert([
      { asset_id: asset.id, tier: "standard", price_cents: Math.round(Number(priceStd) * 100) },
      { asset_id: asset.id, tier: "extended", price_cents: Math.round(Number(priceExt) * 100) },
    ]);
    if (lErr) {
      setError(lErr.message);
      setBusy(false);
      return;
    }

    // Submit for review → runs Layer 1 automated pre-checks server-side
    const { error: sErr } = await supabase.rpc("submit_asset", {
      p_asset_id: asset.id,
    });
    if (sErr) {
      setError(sErr.message);
      setBusy(false);
      return;
    }
    router.push("/sell/dashboard");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Upload a new asset</h1>
      <p className="text-sm text-slate-400 mb-8">
        On submit, your package runs through Layer 1 automated pre-checks (malware
        scan, link check, packaging validation, code lint, plagiarism detection),
        then human review within 3–5 business days.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div>
          <label className="label">Features (one per line)</label>
          <textarea className="input" rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={"Responsive design\nCMS collections\n…"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Platform version</label>
            <input className="input" value={platformVersion} onChange={(e) => setPlatformVersion(e.target.value)} placeholder="e.g. WordPress 6.7+" required />
          </div>
          <div>
            <label className="label">Dependencies (comma-separated)</label>
            <input className="input" value={dependencies} onChange={(e) => setDependencies(e.target.value)} placeholder="Elementor Pro, WooCommerce" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Standard license price ($)</label>
            <input type="number" min="1" step="1" className="input" value={priceStd} onChange={(e) => setPriceStd(e.target.value)} required />
          </div>
          <div>
            <label className="label">Extended license price ($)</label>
            <input type="number" min="1" step="1" className="input" value={priceExt} onChange={(e) => setPriceExt(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Live demo URL (optional)</label>
          <input type="url" className="input" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="label">Asset package (.zip)</label>
          <input
            type="file"
            accept=".zip"
            className="input"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <p className="text-xs text-slate-500 mt-1">
            MVP records package metadata; production uploads to private storage
            with per-purchase tokenized delivery.
          </p>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? "Running automated pre-checks…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
