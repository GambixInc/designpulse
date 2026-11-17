// `logo` files live in public/platforms (Simple Icons, plus HighLevel's own
// mark). Wix's mark is black, so it is inverted on dark surfaces.
export const PLATFORM_META: Record<
  string,
  { label: string; color: string; gradient: string; logo: string; invertOnDark?: boolean }
> = {
  wix_studio: {
    logo: "/platforms/wix_studio.svg",
    invertOnDark: true,
    label: "Wix Studio",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
    gradient: "from-amber-400 to-orange-500",
  },
  webflow: {
    logo: "/platforms/webflow.svg",
    label: "Webflow",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30",
    gradient: "from-blue-400 to-indigo-500",
  },
  wordpress: {
    logo: "/platforms/wordpress.svg",
    label: "WordPress",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
    gradient: "from-sky-400 to-cyan-500",
  },
  shopify: {
    logo: "/platforms/shopify.svg",
    label: "Shopify",
    color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    gradient: "from-green-400 to-emerald-500",
  },
  ghl: {
    logo: "/platforms/ghl.svg",
    label: "Go High Level",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
    gradient: "from-violet-400 to-fuchsia-500",
  },
  automation: {
    logo: "/platforms/automation.svg",
    invertOnDark: true,
    label: "AI & Automation",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30",
    gradient: "from-rose-400 to-orange-500",
  },
};

export function money(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function dateFmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const LICENSE_INFO: Record<string, { label: string; desc: string }> = {
  standard: {
    label: "Standard License",
    desc: "Build one end product, for yourself or for one client. You may not resell or share the item itself.",
  },
  extended: {
    label: "Extended License",
    desc: "Build unlimited end products, for yourself and any number of clients. You may not resell or share the item itself.",
  },
};

/** Structured refund intake — defect categories first; change-of-mind is
 *  auto-flagged server-side for admin denial by default. */
export const REFUND_REASONS: {
  value: string;
  label: string;
  defect: boolean;
}[] = [
  { value: "broken_functionality", label: "Broken functionality / errors", defect: true },
  { value: "missing_files", label: "Missing files or components", defect: true },
  { value: "installation_failure", label: "Installation or import fails", defect: true },
  { value: "doesnt_match_description", label: "Doesn't match the listing description", defect: true },
  { value: "security_vulnerability", label: "Security vulnerability", defect: true },
  { value: "change_of_mind", label: "Changed my mind / no longer needed", defect: false },
  { value: "other", label: "Other", defect: false },
];

export const REFUND_REASON_LABELS: Record<string, string> = Object.fromEntries(
  REFUND_REASONS.map((r) => [r.value, r.label])
);

export const REFUND_WINDOW_DAYS = 7;

export function refundDaysLeft(purchasedAt: string): number {
  const elapsed = Date.now() - new Date(purchasedAt).getTime();
  return Math.max(0, REFUND_WINDOW_DAYS - Math.floor(elapsed / 86_400_000));
}

/** Whole business days elapsed since a timestamp (Mon–Fri), for SLA aging. */
export function businessDaysSince(iso: string): number {
  const start = new Date(iso);
  const now = new Date();
  let days = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < now) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(0, days - 1);
}

/** Per-platform delivery connectors (PRD §5). Wix/Webflow have no install API,
 *  so those are guided flows; Shopify uses OAuth; GHL is the snapshot push. */
export const CONNECTOR_META: Record<
  string,
  { method: string; cta: string; steps: string[] }
> = {
  wix_studio: {
    method: "Wix template link",
    cta: "Get template link",
    steps: [
      "Download the ZIP below: it holds “Use this template.html”, step-by-step instructions and your license.",
      "Open “Use this template.html” and sign in to Wix, or create a free Wix account.",
      "Click “Add Site” (some Wix screens say “Use Template”) to add the template to your account as a new site.",
      "Edit it in the Wix editor it was built with (Studio Editor or Studio Two), then replace the demo text and photos with your own.",
    ],
  },
  webflow: {
    method: "Cloneable project link",
    cta: "Clone to Webflow",
    steps: [
      "Click “Clone to Webflow” — the cloneable project opens in a new tab.",
      "Sign in to Webflow if prompted; the project copies into your workspace.",
      "Your license key (below) unlocks premium interactions per the docs.",
      "Publish to your own domain from Webflow when ready.",
    ],
  },
  wordpress: {
    method: "One-click demo import",
    cta: "Download theme + importer",
    steps: [
      "Download the theme package (includes the bundled demo importer).",
      "In WP Admin → Appearance → Themes → Add New, upload the ZIP and activate.",
      "The importer pulls content.xml, widgets.json, and theme options in one click.",
      "Enter your license key under Appearance → Theme License for updates.",
    ],
  },
  shopify: {
    method: "OAuth app install",
    cta: "Install to my store",
    steps: [
      "Enter your myshopify.com store domain.",
      "Authorize DesignPulse via Shopify OAuth (opens Shopify's consent screen).",
      "We push the theme to your store's theme library via the Themes API.",
      "Preview, then publish from your Shopify admin when you're ready.",
    ],
  },
  automation: {
    method: "Instant download",
    cta: "Download pack",
    steps: [
      "Download the pack: workflow files, setup guide and sample data.",
      "Import each workflow into your own n8n (or open the kit in Claude or ChatGPT).",
      "Connect your accounts as the setup guide lists, one credential at a time.",
      "Run the included test with the sample data before switching it on.",
    ],
  },
  ghl: {
    method: "Snapshot API push",
    cta: "Import snapshot",
    steps: [
      "Your sub-account was connected via OAuth at checkout.",
      "We run a conflict check against existing assets in the sub-account.",
      "Review any conflicts, choose components, and confirm.",
      "The snapshot loads via the GHL Snapshot API — no files to handle.",
    ],
  },
};
