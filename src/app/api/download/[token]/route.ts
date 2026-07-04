import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Secure file delivery (PRD §9): time-limited tokenized URLs.
 * The token is validated + consumed server-side; expired or exhausted tokens 403.
 * MVP packages a placeholder asset bundle; production streams the seller's
 * uploaded package from private storage.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc("use_download_token", {
    p_token: params.token,
  });

  if (error || !data?.ok) {
    return NextResponse.json(
      { error: data?.error ?? error?.message ?? "Invalid download link" },
      { status: 403 }
    );
  }

  const zip = new JSZip();
  const title: string = data.asset_title;
  const slug: string = data.asset_slug;
  const platform: string = data.platform;
  const tier: string = data.license_tier;

  zip.file(
    "README.md",
    `# ${title}\n\nThank you for purchasing from DesignPulse (a Gambix marketplace).\n\n## Installation\nPlatform: ${platform}\nSee docs/install.md for platform-specific setup steps.\n\n## Support\nOpen a ticket from your DesignPulse dashboard.\n`
  );
  zip.file(
    "LICENSE.txt",
    `DesignPulse ${tier === "extended" ? "Extended" : "Standard"} License\n\n${
      tier === "extended"
        ? "Multi-use / client resale rights. Use in unlimited end products, including projects delivered to clients."
        : "Single end product, single domain. Not for resale or redistribution."
    }\n\nYour unique license key is available in your DesignPulse dashboard.\nUnauthorized redistribution is detected via file fingerprinting.\n`
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

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-designpulse.zip"`,
    },
  });
}
