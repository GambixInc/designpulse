import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DesignPulse — Premium Templates & Funnels by Gambix",
  description:
    "Curated design templates for Wix Studio, Webflow, WordPress, Shopify, and Go High Level snapshots. Every asset human-reviewed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-[80vh]">{children}</main>
        <footer className="border-t border-ink-700 mt-16 py-10 text-center text-sm text-slate-500">
          <p>
            DesignPulse — a Gambix marketplace. Every asset passes automated checks +
            human review.
          </p>
          <p className="mt-2">
            MVP demo build · Payments simulated (Stripe Connect integration points
            stubbed) · © {new Date().getFullYear()} Gambix
          </p>
        </footer>
      </body>
    </html>
  );
}
