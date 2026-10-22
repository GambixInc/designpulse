import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
 * Assets with a stored install URL (e.g. a Wix template redemption link) ship
 * that link; everything else still gets the MVP placeholder bundle until
 * seller package uploads to private storage land.
 */
export async function GET(
  _req: NextRequest,
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
  zip.file("LICENSE.txt", licenseText(grant.license_tier));
  if (grant.install_url) {
    addInstallLink(zip, grant, grant.install_url);
  } else {
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

function licenseText(tier: string): string {
  return `DesignPulse ${tier === "extended" ? "Extended" : "Standard"} License\n\n${
    tier === "extended"
      ? "Multi-use / client resale rights. Use in unlimited end products, including projects delivered to clients."
      : "Single end product, single domain. Not for resale or redistribution."
  }\n\nYour unique license key is available in your DesignPulse dashboard.\nUnauthorized redistribution is detected via file fingerprinting.\n`;
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
