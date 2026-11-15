"use client";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/client";

type StoredFile = { path: string; bytes: number; content_type: string; updated_at: string };

// Files are stored in Postgres (asset_files) and sent as base64 through an
// admin-only RPC; keep packages small enough for one request.
const MAX_BYTES = 12 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

type Upload = { path: string; base64: string; type: string };

const TYPES: Record<string, string> = {
  json: "application/json", md: "text/markdown", csv: "text/csv", txt: "text/plain", html: "text/html",
  pdf: "application/pdf", zip: "application/zip", sh: "text/x-shellscript", jpg: "image/jpeg", png: "image/png",
};
const typeOf = (path: string) => TYPES[path.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

/**
 * A .zip is unpacked so the buyer gets its files, not a zip inside a zip.
 * A single top-level folder (pack-name/...) is dropped from the paths.
 */
async function toUploads(file: File, unpack: boolean): Promise<Upload[]> {
  if (!unpack || !file.name.toLowerCase().endsWith(".zip")) {
    return [{ path: file.name, base64: await toBase64(file), type: file.type || typeOf(file.name) }];
  }
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter(
    (e) => !e.dir && !e.name.startsWith("__MACOSX/") && !e.name.endsWith(".DS_Store"),
  );
  const roots = new Set(entries.map((e) => e.name.split("/")[0]));
  const strip = roots.size === 1 && entries.every((e) => e.name.includes("/"));
  return Promise.all(
    entries.map(async (e) => {
      const path = strip ? e.name.slice(e.name.indexOf("/") + 1) : e.name;
      return { path, base64: await e.async("base64"), type: typeOf(path) };
    }),
  );
}

function kb(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The files a buyer downloads for one asset. What is listed here is exactly
 * what goes into the buyer's zip, next to LICENSE.txt.
 */
export default function AssetFilesPanel({ assetId }: { assetId: string }) {
  const supabase = createClient();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [unpack, setUnpack] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_asset_files", { p_asset: assetId });
    if (error) setMessage(error.message);
    else setFiles((data as StoredFile[]) ?? []);
  }, [assetId, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const put = async (u: Upload) => {
    const { error } = await supabase.rpc("admin_put_asset_file", {
      p_asset: assetId,
      p_path: u.path,
      p_base64: u.base64,
      p_content_type: u.type,
    });
    if (error) throw new Error(`${u.path}: ${error.message}`);
  };

  const upload = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setMessage(null);
    try {
      let count = 0;
      for (const file of Array.from(list)) {
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is over ${kb(MAX_BYTES)}`);
        for (const u of await toUploads(file, unpack)) {
          await put(u);
          count++;
        }
      }
      setMessage(`Uploaded ${count} file${count === 1 ? "" : "s"}.`);
    } catch (e) {
      setMessage((e as Error).message);
    }
    setBusy(false);
    load();
  };

  const remove = async (path: string) => {
    if (!confirm(`Remove ${path} from this asset's download?`)) return;
    const { error } = await supabase.rpc("admin_delete_asset_file", { p_asset: assetId, p_path: path });
    setMessage(error ? error.message : `Removed ${path}.`);
    load();
  };

  return (
    <div className="w-full rounded-lg border border-line p-3 mt-2 space-y-2">
      <p className="text-xs text-muted">Download files (what the buyer receives)</p>
      {files.length === 0 && <p className="text-xs text-faint">No files yet: buyers get the placeholder package.</p>}
      <ul className="space-y-1">
        {files.map((f) => (
          <li key={f.path} className="flex items-center gap-3 text-xs">
            <span className="text-ink font-mono flex-1 truncate">{f.path}</span>
            <span className="text-faint">{kb(f.bytes)}</span>
            <button onClick={() => remove(f.path)} className="text-red-500 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <label className="btn-ghost inline-flex cursor-pointer text-xs">
          {busy ? "Uploading…" : "Upload files"}
          <input type="file" multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
        </label>
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={unpack} onChange={(e) => setUnpack(e.target.checked)} />
          Unpack .zip files
        </label>
      </div>
      {message && <p className="text-xs text-muted" role="status">{message}</p>}
    </div>
  );
}
