import type { SupabaseClient } from "@supabase/supabase-js";

export type AssetListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_first_party: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
  platform: string;
  category_name: string;
  min_price_cents: number;
};

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

export function toListItem(row: Row): AssetListItem {
  const prices: number[] = (row.asset_licenses ?? []).map(
    (l: Row) => l.price_cents as number
  );
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    is_first_party: row.is_first_party,
    is_featured: row.is_featured,
    rating_avg: Number(row.rating_avg),
    rating_count: row.rating_count,
    sales_count: row.sales_count,
    created_at: row.created_at,
    platform: row.categories?.platform ?? "wordpress",
    category_name: row.categories?.name ?? "",
    min_price_cents: prices.length ? Math.min(...prices) : 0,
  };
}

export async function fetchAssets(
  supabase: SupabaseClient,
  opts: {
    platform?: string;
    q?: string;
    sort?: string;
    minRating?: number;
    featuredOnly?: boolean;
    limit?: number;
  } = {}
): Promise<AssetListItem[]> {
  let query = supabase
    .from("assets")
    .select(
      "id, slug, title, description, is_first_party, is_featured, rating_avg, rating_count, sales_count, created_at, categories(name, platform), asset_licenses(price_cents)"
    )
    .eq("status", "approved");

  if (opts.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts.featuredOnly) query = query.eq("is_featured", true);
  if (opts.minRating) query = query.gte("rating_avg", opts.minRating);

  switch (opts.sort) {
    case "trending":
      query = query.order("sales_count", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) throw error;
  let items = (data ?? []).map(toListItem);
  if (opts.platform) items = items.filter((i) => i.platform === opts.platform);
  if (opts.sort === "price_asc")
    items.sort((a, b) => a.min_price_cents - b.min_price_cents);
  if (opts.sort === "price_desc")
    items.sort((a, b) => b.min_price_cents - a.min_price_cents);
  return items;
}
