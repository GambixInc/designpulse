export const PLATFORM_META: Record<
  string,
  { label: string; color: string; gradient: string }
> = {
  wix_studio: {
    label: "Wix Studio",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
    gradient: "from-amber-400 to-orange-500",
  },
  webflow: {
    label: "Webflow",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30",
    gradient: "from-blue-400 to-indigo-500",
  },
  wordpress: {
    label: "WordPress",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
    gradient: "from-sky-400 to-cyan-500",
  },
  shopify: {
    label: "Shopify",
    color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    gradient: "from-green-400 to-emerald-500",
  },
  ghl: {
    label: "Go High Level",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
    gradient: "from-violet-400 to-fuchsia-500",
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
    desc: "Use in a single end product on a single domain. Not for client resale.",
  },
  extended: {
    label: "Extended License",
    desc: "Multi-use and client resale rights. Use in unlimited projects, including work for clients.",
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
    method: "Guided manual install",
    cta: "Get install guide",
    steps: [
      "Download the template export package below.",
      "Open Wix Studio and create a new site from a blank template.",
      "Follow the included INSTALL.md to import sections, pages, and styles.",
      "Apply your content — the guide maps every placeholder.",
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
