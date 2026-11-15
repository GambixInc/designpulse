// Dry run of the 2026-11-15 migrations against a stub of the live schema, in PGlite.
//   npm install --no-save @electric-sql/pglite@0.2.17 && node scripts/migration-dryrun-20261115.mjs supabase/migrations
// Applies the three files in order, then checks listings, publish guard, token-gated downloads, grants and RLS.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const dir = process.argv[2];
const db = new PGlite();
const ok = (m) => console.log('✓', m), bad = (m) => { console.log('✗', m); process.exitCode = 1; };
await db.exec(`
create role anon; create role authenticated;
create type platform_type as enum ('wix_studio','webflow','wordpress','shopify','ghl');
create type license_tier as enum ('standard','extended');
create type asset_status as enum ('draft','pending_review','approved','rejected','delisted');
create table categories (id serial primary key, slug text not null unique, name text not null, platform platform_type not null, description text, phase int not null default 1);
insert into categories (slug,name,platform) values ('wix-studio','Wix Studio Templates','wix_studio');
create table assets (id uuid primary key default gen_random_uuid(), seller_id uuid, category_id int not null references categories(id), title text not null, slug text not null unique,
  description text, features text[] not null default '{}', compatibility jsonb not null default '{}', demo_url text, status asset_status not null default 'draft',
  is_first_party bool not null default false, is_featured bool not null default false, rating_avg numeric not null default 0, rating_count int not null default 0,
  sales_count int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), preview_images text[] not null default '{}');
create table asset_licenses (id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), tier license_tier not null, price_cents int not null check (price_cents >= 0), unique (asset_id, tier));
create table asset_packages (asset_id uuid not null, install_url text not null, updated_at timestamptz not null default now());
create table order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null default gen_random_uuid(), asset_id uuid not null, seller_id uuid,
  license_tier license_tier not null default 'standard', price_cents int not null default 0, commission_cents int not null default 0, seller_earnings_cents int not null default 0, refunded bool not null default false);
create table download_tokens (id uuid primary key default gen_random_uuid(), order_item_id uuid not null, token text not null, expires_at timestamptz not null, max_uses int not null default 5, use_count int not null default 0, created_at timestamptz not null default now());
create table admin_flag (on_ bool); insert into admin_flag values (true);
create function is_admin() returns boolean language sql stable as $$ select on_ from admin_flag $$;
`);
for (const f of ['20261115120000_automation_platform.sql', '20261115120100_asset_files.sql', '20261115120200_ai_automation_listings.sql']) {
  try { await db.exec(readFileSync(`${dir}/${f}`, 'utf8')); ok(`applied ${f}`); } catch (e) { bad(`${f}: ${e.message}`); }
}
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const assets = await q(`select a.slug, a.status, c.slug cat, (select count(*) from asset_licenses l where l.asset_id=a.id)::int lic from assets a join categories c on c.id=a.category_id`);
assets.length === 7 && assets.every((a) => a.status === 'draft' && a.lic === 2) ? ok(`7 draft listings with 2 licences each (${assets.map((a) => a.slug).join(', ')})`) : bad(JSON.stringify(assets));
const compat = await q(`select compatibility->>'tested' t from assets where slug='ai-speed-to-lead'`);
compat[0].t.includes("n8n's own") ? ok('listing text quotes render') : bad(compat[0].t);
const [{ id }] = await q(`select id from assets where slug='ai-speed-to-lead'`);
try { await q(`select admin_publish_asset($1)`, [id]); bad('published without files'); } catch (e) { e.message.includes('Upload the files') ? ok('publish refused without files') : bad(e.message); }
await q(`select admin_put_asset_file($1, 'workflows/a.json', $2, 'application/json')`, [id, Buffer.from('{"hi":1}').toString('base64')]);
try { await q(`select admin_put_asset_file($1, '../etc/passwd', 'eA==', 'text/plain')`, [id]); bad('accepted ../ path'); } catch { ok('rejects ../ paths'); }
const files = await q(`select admin_list_asset_files($1) f`, [id]);
ok(`admin list: ${JSON.stringify(files[0].f)}`);
await q(`select admin_publish_asset($1)`, [id]);
(await q(`select status from assets where id=$1`, [id]))[0].status === 'approved' ? ok('publish works once files exist') : bad('not approved');
const [{ id: oi }] = await q(`insert into order_items (asset_id) values ($1) returning id`, [id]);
await q(`insert into download_tokens (order_item_id, token, expires_at) values ($1,'live', now()+interval '1 day'), ($1,'old', now()-interval '1 day')`, [oi]);
const m = (await q(`select download_manifest('live') m`))[0].m;
m.ok && m.files.length === 1 && m.files[0].bytes === 8 ? ok('manifest for a live token') : bad(JSON.stringify(m));
const f = (await q(`select download_file('live','workflows/a.json') f`))[0].f;
Buffer.from(f.data, 'base64').toString() === '{"hi":1}' ? ok('file round-trips') : bad(JSON.stringify(f));
(await q(`select download_manifest('old') m`))[0].m.ok === false ? ok('expired token refused') : bad('expired token accepted');
(await q(`select download_file('live','nope') f`))[0].f.ok === false ? ok('unknown path refused') : bad('unknown path');
await q(`update order_items set refunded=true where id=$1`, [oi]);
(await q(`select download_manifest('live') m`))[0].m.ok === false ? ok('refunded purchase refused') : bad('refunded accepted');
await q(`update admin_flag set on_=false`);
try { await q(`select admin_put_asset_file($1,'x.txt','eA==','text/plain')`, [id]); bad('non-admin upload allowed'); } catch { ok('non-admin upload refused'); }
const grants = await q(`select p.proname, array_agg(distinct r.rolname order by r.rolname) roles from pg_proc p cross join pg_roles r
  where p.proname in ('download_manifest','download_file','download_token_asset','admin_put_asset_file','admin_publish_asset') and r.rolname in ('anon','authenticated')
  and has_function_privilege(r.rolname, p.oid, 'execute') group by p.proname order by 1`);
console.log('  execute grants:', JSON.stringify(grants));
const rls = await q(`select relrowsecurity from pg_class where relname='asset_files'`);
rls[0].relrowsecurity ? ok('asset_files has RLS on') : bad('RLS off');
