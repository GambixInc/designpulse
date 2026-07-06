"use client";
import { useState } from "react";
import { CONNECTOR_META, PLATFORM_META } from "@/lib/format";

/**
 * Platform connector delivery flows (PRD §5). Wix Studio and Webflow have no
 * install API, so those are guided experiences; Shopify simulates its OAuth
 * app-install flow; WordPress ships the bundled one-click demo importer.
 * GHL is handled separately by GhlImportFlow (snapshot push).
 */
export default function DeliveryModal({
  platform,
  title,
  slug,
  onDownload,
  onClose,
}: {
  platform: string;
  title: string;
  slug: string;
  onDownload: () => Promise<void>;
  onClose: () => void;
}) {
  const connector = CONNECTOR_META[platform];
  const meta = PLATFORM_META[platform];
  const [busy, setBusy] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [shopifyStep, setShopifyStep] = useState<"domain" | "authorizing" | "done">("domain");

  const download = async () => {
    setBusy(true);
    await onDownload();
    setBusy(false);
  };

  const authorizeShopify = () => {
    if (!shopDomain.trim()) return;
    setShopifyStep("authorizing");
    // Production: redirect to the per-store OAuth URL, exchange the code for an
    // access token, then push theme files via the Themes API.
    setTimeout(() => setShopifyStep("done"), 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <div className="card p-6 max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-ink">Install “{title}”</h3>
          <button onClick={onClose} className="text-faint hover:text-ink">✕</button>
        </div>
        <p className="text-xs text-muted mb-4">
          {meta.label} · {connector.method}
        </p>

        <ol className="space-y-2.5 mb-5">
          {connector.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted">
              <span className="h-5 w-5 shrink-0 rounded-full bg-accent-soft text-accent grid place-items-center text-xs font-semibold">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        {platform === "webflow" && (
          <a
            href={`https://webflow.com/made-in-webflow/website/designpulse-${slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full"
          >
            Clone to Webflow ↗
          </a>
        )}

        {(platform === "wix_studio" || platform === "wordpress") && (
          <button onClick={download} disabled={busy} className="btn-primary w-full">
            {busy
              ? "Preparing package…"
              : platform === "wordpress"
                ? "⬇ Download theme + demo importer"
                : "⬇ Download export + install guide"}
          </button>
        )}

        {platform === "shopify" && (
          <div>
            {shopifyStep === "domain" && (
              <>
                <label className="label">Your store domain</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="your-store.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                  />
                  <button onClick={authorizeShopify} className="btn-primary whitespace-nowrap">
                    Authorize
                  </button>
                </div>
                <p className="mt-2 text-xs text-faint">
                  Opens Shopify&apos;s OAuth consent screen (simulated in this MVP).
                </p>
              </>
            )}
            {shopifyStep === "authorizing" && (
              <p className="text-sm text-muted text-center py-3">
                Authorizing with {shopDomain} and pushing theme via the Themes API…
              </p>
            )}
            {shopifyStep === "done" && (
              <div className="text-center py-2">
                <p className="text-emerald-500 font-medium">✓ Theme pushed to {shopDomain}</p>
                <p className="mt-1 text-xs text-muted">
                  Find it under Online Store → Themes, then preview and publish.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
