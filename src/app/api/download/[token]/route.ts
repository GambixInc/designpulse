import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

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
 * RPCs) ship those files; assets with a stored install URL (a Wix template
 * redemption link) ship that link; anything else still gets the placeholder.
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
  let files = 0;
  try {
    files = await addStoredFiles(zip, supabase, params.token);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  if (files === 0 && grant.install_url) {
    addInstallLink(zip, grant, grant.install_url);
  } else if (files === 0) {
    addPlaceholder(zip, grant);
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

/** Adds every stored file for the token's asset; returns how many there were. */
async function addStoredFiles(zip: JSZip, supabase: SupabaseClient, token: string): Promise<number> {
  const { data, error } = await supabase.rpc("download_manifest", { p_token: token });
  // PGRST202: the function is not deployed yet; behave as before file storage.
  if (error?.code === "PGRST202") return 0;
  if (error) throw new Error("Could not list the files; try the link again");
  const manifest = data as Manifest | null;
  if (!manifest?.ok) return 0;
  for (const f of manifest.files ?? []) {
    const res = await supabase.rpc("download_file", { p_token: token, p_path: f.path });
    const file = res.data as StoredFile | null;
    if (res.error || !file?.ok) throw new Error(`Could not read ${f.path}; try the link again`);
    zip.file(file.path, file.data, { base64: true });
  }
  return manifest.files?.length ?? 0;
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
      : "Your license key is shown with this purchase in your DesignPulse dashboard.",
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
  zip.file(
    "Instructions.txt",
    `How to add ${grant.asset_title} to your Wix account\n\n1. Open "Use this template.html" from this ZIP.\n2. Log in to Wix, or sign up if you don't have an account.\n3. Agree to the terms and click "Add Site".\n4. The template is added to your account as a new site, ready to customize in the Studio Editor.\n\nNeed help? Open a ticket from your DesignPulse dashboard.\n`
  );
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
