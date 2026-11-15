-- Real file delivery for assets that ship as files (n8n workflow packs, AI
-- agent kits, theme zips), without a service-role key or a public bucket.
--
-- Files live in asset_files, which no client role can read. The anonymous
-- download route first calls use_download_token (which validates and counts
-- the download), then reads the file list and each file through the two
-- security definer functions below, which accept only a live, unrefunded
-- download token for the asset. Admins upload files through
-- admin_put_asset_file from the admin page.

insert into public.categories (slug, name, platform, description, phase) values
  ('n8n-workflows', 'n8n Workflows', 'automation',
   'Importable n8n workflow packs with setup guides: lead response, website chat, inbox and invoice triage, content and product copy', 1),
  ('ai-agent-kits', 'AI Agent Kits', 'automation',
   'Claude and ChatGPT agent kits, skills and prompt systems for agencies and small businesses', 1)
on conflict do nothing;

create table public.asset_files (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  path text not null check (path ~ '^[A-Za-z0-9][A-Za-z0-9 ._/()-]*$' and path !~ '\.\.'),
  content bytea not null,
  content_type text not null default 'application/octet-stream',
  bytes integer generated always as (octet_length(content)) stored,
  updated_at timestamptz not null default now(),
  unique (asset_id, path)
);
alter table public.asset_files enable row level security;
-- No policies: only the security definer functions below touch this table.
revoke all on public.asset_files from public, anon, authenticated;

-- The token's asset, if the token is live and the purchase stands. Expiry and
-- refunds are checked; the use count is not, because use_download_token has
-- just counted this download.
create or replace function public.download_token_asset(p_token text)
returns uuid
language sql stable security definer
set search_path = public
as $$
  select oi.asset_id
    from download_tokens dt
    join order_items oi on oi.id = dt.order_item_id
   where dt.token = p_token
     and dt.expires_at > now()
     and not oi.refunded;
$$;

create or replace function public.download_manifest(p_token text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v_asset uuid := public.download_token_asset(p_token);
begin
  if v_asset is null then return jsonb_build_object('ok', false, 'error', 'Invalid or expired download link'); end if;
  return jsonb_build_object('ok', true, 'files', coalesce((
    select jsonb_agg(jsonb_build_object('path', f.path, 'bytes', f.bytes, 'content_type', f.content_type) order by f.path)
      from asset_files f where f.asset_id = v_asset), '[]'::jsonb));
end $$;

create or replace function public.download_file(p_token text, p_path text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_asset uuid := public.download_token_asset(p_token);
  v_file asset_files%rowtype;
begin
  if v_asset is null then return jsonb_build_object('ok', false, 'error', 'Invalid or expired download link'); end if;
  select * into v_file from asset_files where asset_id = v_asset and path = p_path;
  if not found then return jsonb_build_object('ok', false, 'error', 'No such file'); end if;
  return jsonb_build_object('ok', true, 'path', v_file.path, 'content_type', v_file.content_type,
    'data', encode(v_file.content, 'base64'));
end $$;

-- Admin upload and removal (the admin page sends files as base64).
create or replace function public.admin_put_asset_file(p_asset uuid, p_path text, p_base64 text, p_content_type text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_bytes integer;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  insert into asset_files (asset_id, path, content, content_type)
  values (p_asset, p_path, decode(p_base64, 'base64'), coalesce(nullif(p_content_type, ''), 'application/octet-stream'))
  on conflict (asset_id, path) do update
    set content = excluded.content, content_type = excluded.content_type, updated_at = now()
  returning bytes into v_bytes;
  return jsonb_build_object('ok', true, 'path', p_path, 'bytes', v_bytes);
end $$;

create or replace function public.admin_delete_asset_file(p_asset uuid, p_path text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from asset_files where asset_id = p_asset and path = p_path;
end $$;

create or replace function public.admin_list_asset_files(p_asset uuid)
returns table (path text, bytes integer, content_type text, updated_at timestamptz)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query select f.path, f.bytes, f.content_type, f.updated_at from asset_files f where f.asset_id = p_asset order by f.path;
end $$;

-- Grants. New functions get EXECUTE for PUBLIC by default; set them explicitly.
revoke all on function public.download_token_asset(text) from public, anon, authenticated;
revoke all on function public.download_manifest(text) from public;
revoke all on function public.download_file(text, text) from public;
grant execute on function public.download_manifest(text) to anon, authenticated;
grant execute on function public.download_file(text, text) to anon, authenticated;
revoke all on function public.admin_put_asset_file(uuid, text, text, text) from public, anon;
revoke all on function public.admin_delete_asset_file(uuid, text) from public, anon;
revoke all on function public.admin_list_asset_files(uuid) from public, anon;
grant execute on function public.admin_put_asset_file(uuid, text, text, text) to authenticated;
grant execute on function public.admin_delete_asset_file(uuid, text) to authenticated;
grant execute on function public.admin_list_asset_files(uuid) to authenticated;
