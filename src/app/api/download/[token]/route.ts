import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { REFUND_WINDOW_DAYS } from "@/lib/format";

export const dynamic = "force-dynamic";

type DownloadGrant = {
  ok: boolean;
  error?: string;
  asset_title: string;
  asset_slug: string;
  platform: string;
  license_tier: string;
  install_url: string | null;
};

/**
 * Secure file delivery (PRD §9): time-limited tokenized URLs.
 * The token is validated + consumed server-side; expired or exhausted tokens 403.
 * Assets with stored files (asset_files, read only through token-checked
 * RPCs) ship those files (a Shopify theme's files get install instructions
 * that name the theme zip); assets with a stored install URL (a Wix template
 * redemption link) ship that link, alongside any stored files; anything with
 * neither still gets the placeholder.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc("use_download_token", {
    p_token: params.token,
  });
  const grant = data as DownloadGrant | null;

  if (error || !grant?.ok) {
    return NextResponse.json(
      { error: grant?.error ?? error?.message ?? "Invalid download link" },
      { status: 403 }
    );
  }

  const zip = new JSZip();
  zip.file("LICENSE.txt", licenseText(grant.license_tier, Boolean(grant.install_url), req.nextUrl.origin));
  let paths: string[] = [];
  try {
    paths = await addStoredFiles(zip, supabase, params.token);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  // Written after the stored files, so the generated files win over any
  // stored file with the same name.
  if (grant.install_url) {
    addInstallLink(zip, grant, grant.install_url);
  } else if (paths.length === 0) {
    addPlaceholder(zip, grant);
  } else if (grant.platform === "shopify") {
    zip.file("Install instructions.txt", shopifyInstructions(grant.asset_title, paths));
  }

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${grant.asset_slug}-designpulse.zip"`,
    },
  });
}

type Manifest = { ok: boolean; error?: string; files?: { path: string; bytes: number }[] };
type StoredFile = { ok: boolean; error?: string; path: string; data: string };

/** Adds every stored file for the token's asset; returns their paths. */
async function addStoredFiles(zip: JSZip, supabase: SupabaseClient, token: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("download_manifest", { p_token: token });
  // PGRST202: the function is not deployed yet; behave as before file storage.
  if (error?.code === "PGRST202") return [];
  if (error) throw new Error("Could not list the files; try the link again");
  const manifest = data as Manifest | null;
  if (!manifest?.ok) return [];
  for (const f of manifest.files ?? []) {
    const res = await supabase.rpc("download_file", { p_token: token, p_path: f.path });
    const file = res.data as StoredFile | null;
    if (res.error || !file?.ok) throw new Error(`Could not read ${f.path}; try the link again`);
    zip.file(file.path, file.data, { base64: true });
  }
  return (manifest.files ?? []).map((f) => f.path);
}

/**
 * Plain-text summary of /legal/license. A Wix template link is one link shared
 * by every buyer of that template, so it carries no per-buyer key or tracking.
 */
function licenseText(tier: string, viaWixLink: boolean, origin: string): string {
  const extended = tier === "extended";
  return [
    `DesignPulse ${extended ? "Extended" : "Standard"} License`,
    "",
    extended
      ? "You may use this item to build unlimited end products, for yourself and for any number of clients. You may charge clients for the end products you build and hand those end products over to them."
      : "You may use this item to build one end product (one website, store, funnel or Go High Level sub-account), for yourself or for one client. You may modify it however you like and keep using it for as long as that end product exists.",
    "",
    "Neither license lets you resell, share, sublicense or give away the item itself, modified or not, including as a template, theme, kit, snapshot or share link. Neither lets you use it to train AI or to build a competing product.",
    "",
    "Any demo photos come from free-license libraries such as Pexels and Pixabay, and any demo names, contact details, testimonials and figures are fictional placeholders. Replace them with your own before you publish.",
    "",
    viaWixLink
      ? "The Wix template link in this ZIP is the same link every buyer of this template receives. Keep it private: sharing it counts as redistributing the item."
      : "Your license key is unique to this purchase and is shown with it in your DesignPulse dashboard. Quote it when you ask for support or updates. Keep the files in this ZIP private: sharing them counts as redistributing the item.",
    "",
    `Full terms: ${origin}/legal/license`,
    "",
  ].join("\n");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function addInstallLink(zip: JSZip, grant: DownloadGrant, url: string) {
  const href = escapeAttr(url);
  const title = escapeAttr(grant.asset_title);
  zip.file(
    "Use this template.html",
    `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${href}"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem">Opening Wix to add ${title} to your account. If nothing happens, <a href="${href}">click here</a>.</body></html>`
  );
  zip.file("Instructions.txt", installInstructions(grant.asset_title, url));
}

function installInstructions(title: string, url: string): string {
  return [
    `How to add ${title} to your Wix account`,
    "",
    `1. Open "Use this template.html" from this ZIP. It opens the template's Wix link in your browser. If it does not, paste this link into your browser: ${url}`,
    "2. Sign in to Wix, or create a free Wix account.",
    '3. Accept Wix\'s terms if asked, then click "Add Site" (some Wix screens say "Use Template").',
    "4. Wix adds the template to your account as a new site. It opens in the Wix editor it was built with (Studio Editor or Studio Two). A Studio Two template needs Studio Two access in your Wix account.",
    "5. Replace the demo text and photos with your own before you publish. Connecting your own domain, taking payments or taking bookings needs a Wix premium plan.",
    "",
    `If the link does not open or Wix does not add the site, tell us within ${REFUND_WINDOW_DAYS} days of purchase: in your DesignPulse dashboard, click Refund on this purchase and choose "Installation or import fails".`,
    "",
  ].join("\n");
}

/**
 * Buyers often upload the whole download to Shopify, which rejects it
 * ("missing template layout/theme.liquid"); this names the zip to upload.
 */
function shopifyInstructions(title: string, paths: string[]): string {
  const themeZips = paths.filter((p) => p.toLowerCase().endsWith(".zip"));
  const themeZip = themeZips.length ? `"${themeZips.join('" or "')}"` : "the theme zip";
  return [
    `How to install ${title} in your Shopify store`,
    "",
    "1. Unzip this download first. Do not upload this DesignPulse ZIP to Shopify: it is a package, not a theme, and Shopify will reject it.",
    `2. In your Shopify admin, go to Online Store > Themes > Add theme > Upload zip file (newer admin screens say Import theme), and choose ${themeZip} from this download.`,
    "3. Shopify adds the theme to your theme library. Open the launch guide in this download and follow it to set up menus, pages and product details.",
    "4. Click Customize to preview the theme with your own products, then publish it when you are ready.",
    "",
    "Good to know: uploaded themes need a Shopify plan of Basic or higher; the Starter plan cannot install them. Demo products, photos, pages and apps are not part of the theme, so it shows your own products and images. This theme is compatible with Shopify but is not made, endorsed or supported by Shopify: support and updates come from DesignPulse.",
    "",
    `If the theme will not upload or install, tell us within ${REFUND_WINDOW_DAYS} days of purchase: in your DesignPulse dashboard, click Refund on this purchase and choose "Installation or import fails".`,
    "",
  ].join("\n");
}

function addPlaceholder(zip: JSZip, grant: DownloadGrant) {
  const { asset_title: title, asset_slug: slug, platform } = grant;
  zip.file(
    "README.md",
    `# ${title}\n\nThank you for purchasing from DesignPulse (a Gambix marketplace).\n\n## Installation\nPlatform: ${platform}\nSee docs/install.md for platform-specific setup steps.\n\n## Support\nOpen a ticket from your DesignPulse dashboard.\n`
  );
  zip.file(
    "docs/install.md",
    `# Installing ${title}\n\n1. Unzip this package.\n2. Follow the ${platform} import guide.\n3. Activate with the license key from your dashboard.\n`
  );
  if (platform === "ghl") {
    zip.file(
      "snapshot.json",
      JSON.stringify(
        { snapshot: slug, note: "Use the one-click import from your dashboard instead — this file is a fallback share format." },
        null,
        2
      )
    );
  } else {
    zip.file(
      `${slug}/index.html`,
      `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1><p>Placeholder template package (MVP demo).</p></body></html>`
    );
  }
}
