export const PLATFORM_META: Record<
  string,
  { label: string; color: string; gradient: string }
> = {
  wix_studio: {
    label: "Wix Studio",
    color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    gradient: "from-amber-500/60 to-orange-600/60",
  },
  webflow: {
    label: "Webflow",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    gradient: "from-blue-500/60 to-indigo-600/60",
  },
  wordpress: {
    label: "WordPress",
    color: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    gradient: "from-sky-500/60 to-cyan-600/60",
  },
  shopify: {
    label: "Shopify",
    color: "bg-green-500/15 text-green-300 border-green-500/30",
    gradient: "from-green-500/60 to-emerald-600/60",
  },
  ghl: {
    label: "Go High Level",
    color: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    gradient: "from-violet-500/60 to-fuchsia-600/60",
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
