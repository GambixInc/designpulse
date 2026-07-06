import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DesignPulse — Premium Templates & Funnels by Gambix",
  description:
    "Curated design templates for Wix Studio, Webflow, WordPress, Shopify, and Go High Level snapshots. Every asset human-reviewed.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('dp-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

const FOOTER_COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "Categories",
    links: [
      ["Wix Studio", "/marketplace?platform=wix_studio"],
      ["Webflow", "/marketplace?platform=webflow"],
      ["WordPress", "/marketplace?platform=wordpress"],
      ["Shopify", "/marketplace?platform=shopify"],
      ["GHL Snapshots", "/marketplace?platform=ghl"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Gambix", "/marketplace"],
      ["Sell with us", "/sell"],
      ["Licenses", "/licenses"],
      ["Support", "/dashboard"],
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Navbar />
        <main className="min-h-[80vh]">{children}</main>
        <footer className="border-t border-line mt-20">
          <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-ink">
                <span className="inline-block h-5 w-5 rounded-md bg-accent" />
                DesignPulse
              </div>
              <p className="mt-3 text-sm text-faint max-w-xs">
                A Gambix marketplace. Every asset passes automated checks and
                in-house human review.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-faint mb-3">
                  {col.title}
                </p>
                <ul className="space-y-2 text-sm">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-muted hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line py-5 text-center text-xs text-faint">
            MVP demo build · Payments simulated (Stripe Connect stubbed) · ©{" "}
            {new Date().getFullYear()} Gambix
          </div>
        </footer>
      </body>
    </html>
  );
}
