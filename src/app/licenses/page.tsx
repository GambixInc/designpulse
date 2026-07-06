import Link from "next/link";
import { LICENSE_INFO, REFUND_WINDOW_DAYS } from "@/lib/format";

export const metadata = { title: "Licenses & Pricing — DesignPulse" };

const COMPARISON: [string, string, string][] = [
  ["Use in one end product (single domain)", "✓", "✓"],
  ["Use in unlimited projects", "—", "✓"],
  ["Client work & resale rights", "—", "✓"],
  ["Lifetime updates for the purchased version", "✓", "✓"],
  ["Unique license key per purchase", "✓", "✓"],
  ["Priority support", "—", "✓"],
];

export default function LicensesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Licenses & pricing
      </h1>
      <p className="mt-3 text-muted">
        Every asset on DesignPulse is sold under one of two licenses. Prices are
        set per asset by the seller; the license defines what you can do with it.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {Object.entries(LICENSE_INFO).map(([tier, info]) => (
          <div key={tier} className="card p-6">
            <h2 className="font-semibold text-ink">{info.label}</h2>
            <p className="mt-2 text-sm text-muted">{info.desc}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="p-4 font-medium text-muted">What you get</th>
              <th className="p-4 font-medium text-ink">Standard</th>
              <th className="p-4 font-medium text-ink">Extended</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map(([feature, std, ext]) => (
              <tr key={feature} className="border-b border-line last:border-0">
                <td className="p-4 text-muted">{feature}</td>
                <td className="p-4 text-ink">{std}</td>
                <td className="p-4 text-ink">{ext}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6 mt-6">
        <h2 className="font-semibold text-ink">Refund policy</h2>
        <p className="mt-2 text-sm text-muted">
          Refunds are available within {REFUND_WINDOW_DAYS} days of purchase for
          verifiable technical defects only — broken functionality, missing
          files, failed installs, security issues, or listings that don&apos;t
          match their description. Requests are reviewed by Gambix&apos;s
          in-house team; change-of-mind requests are not eligible. The window is
          enforced automatically at the system level.
        </p>
      </div>

      <p className="mt-8 text-center">
        <Link href="/marketplace" className="btn-primary px-6 py-2.5">
          Browse the marketplace
        </Link>
      </p>
    </div>
  );
}
