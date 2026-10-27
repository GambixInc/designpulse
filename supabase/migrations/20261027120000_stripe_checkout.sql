-- Real Stripe Checkout, verified in Postgres.
--
-- The Stripe secret key lives only in Supabase Vault (secret name
-- `stripe_secret_key`); Postgres talks to Stripe through the `http`
-- extension. Prices, the session, payment verification and fulfillment all
-- happen inside security definer functions, so the browser can never set a
-- price or mark an order paid, and no service-role key is needed anywhere.
--
-- Flow: start_checkout() prices the cart and creates a Stripe Checkout
-- Session -> buyer pays on Stripe's hosted page -> fulfill_checkout() asks
-- Stripe whether the session is paid and, if so, creates the order. The
-- success page and the Stripe webhook both call fulfill_checkout(); it is
-- idempotent, so whichever arrives first wins.

create extension if not exists http with schema extensions;

-- Nothing outside these functions should make outbound HTTP calls. On
-- Supabase this revoke is a no-op for the extension's own PUBLIC grant (it is
-- made by supabase_admin, which postgres cannot revoke); what keeps browsers
-- away from extensions.http is that the extensions schema is not exposed
-- through the API.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'extensions' and p.proname like 'http%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

create table public.stripe_checkouts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  items jsonb not null,
  ghl_connection_id uuid references public.ghl_connections(id),
  amount_cents int not null check (amount_cents >= 50),
  currency text not null default 'usd',
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  stripe_session_id text unique,
  stripe_payment_intent text,
  livemode boolean,
  status text not null default 'open' check (status in ('open', 'complete', 'expired')),
  order_id uuid references public.orders(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index stripe_checkouts_buyer_idx on public.stripe_checkouts (buyer_id, created_at desc);

alter table public.stripe_checkouts enable row level security;
create policy "checkouts read own" on public.stripe_checkouts
  for select using (buyer_id = auth.uid() or public.is_admin());

-- Bump this (and LEGAL.termsVersion in src/lib/legal.ts) whenever the Terms
-- of Sale change; checkouts record which version the buyer accepted.
create or replace function public.current_terms_version()
returns text language sql immutable as $$ select '2026-10-27'::text $$;

create or replace function public.stripe_api(
  p_method text, p_path text, p_params jsonb default '{}'::jsonb,
  p_idempotency_key text default null)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_key text;
  v_headers extensions.http_header[];
  v_resp extensions.http_response;
  v_body jsonb;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets
    where name = 'stripe_secret_key' limit 1;
  if coalesce(v_key, '') = '' then
    raise exception 'STRIPE_NOT_CONFIGURED: payments are not switched on yet';
  end if;
  v_headers := array[extensions.http_header('Authorization', 'Bearer ' || v_key)];
  if p_idempotency_key is not null then
    v_headers := v_headers || extensions.http_header('Idempotency-Key', p_idempotency_key);
  end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '6000');
  v_resp := extensions.http((p_method, 'https://api.stripe.com/v1/' || p_path, v_headers,
    'application/x-www-form-urlencoded',
    case when p_method = 'GET' then null else extensions.urlencode(p_params) end
  )::extensions.http_request);
  v_body := v_resp.content::jsonb;
  if v_resp.status >= 400 then
    -- Stripe's message can echo part of the key, so only the code goes out.
    raise exception 'STRIPE_ERROR: %',
      coalesce(v_body #>> '{error,code}', v_body #>> '{error,type}', 'http_' || v_resp.status);
  end if;
  return v_body;
end $$;

create or replace function public.assert_checkout_origin(p_origin text)
returns void language plpgsql immutable as $$
begin
  if p_origin is null or not (
       p_origin = 'https://designpulse-seven.vercel.app'
    or p_origin ~ '^https://designpulse-[a-z0-9-]+-gambix1\.vercel\.app$'
    or p_origin ~ '^http://localhost:[0-9]{2,5}$') then
    raise exception 'Checkout is not available from this address';
  end if;
end $$;

-- Prices come from asset_licenses at the moment of checkout and are locked
-- into the checkout row; the browser only sends license ids.
create or replace function public.checkout_line_items(p_license_ids uuid[])
returns jsonb language plpgsql stable security definer
set search_path = public
as $$
declare v_items jsonb;
begin
  if coalesce(cardinality(p_license_ids), 0) = 0 then raise exception 'Empty cart'; end if;
  if (select count(distinct x) from unnest(p_license_ids) x) <> cardinality(p_license_ids) then
    raise exception 'The same item is in the cart twice';
  end if;
  select jsonb_agg(jsonb_build_object(
      'license_id', al.id, 'asset_id', a.id, 'title', a.title, 'tier', al.tier,
      'price_cents', al.price_cents, 'platform', c.platform,
      'first_party', a.is_first_party) order by u.ord)
    into v_items
    from unnest(p_license_ids) with ordinality u(lid, ord)
    join asset_licenses al on al.id = u.lid
    join assets a on a.id = al.asset_id and a.status = 'approved'
    join categories c on c.id = a.category_id;
  if coalesce(jsonb_array_length(v_items), 0) <> cardinality(p_license_ids) then
    raise exception 'One or more items are no longer available';
  end if;
  return v_items;
end $$;

-- Third-party sellers need Stripe Connect payouts before their items can be
-- sold; GHL snapshots need a connected sub-account.
create or replace function public.assert_checkout_allowed(
  p_items jsonb, p_ghl_connection_id uuid, p_buyer uuid)
returns void language plpgsql stable security definer
set search_path = public
as $$
begin
  if exists (select 1 from jsonb_array_elements(p_items) x
             where not (x->>'first_party')::boolean) then
    raise exception 'THIRD_PARTY_UNAVAILABLE: marketplace seller items are not on sale yet';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) x where x->>'platform' = 'ghl')
     and not exists (select 1 from ghl_connections where id = p_ghl_connection_id
                     and buyer_id = p_buyer and status = 'active') then
    raise exception 'GHL_OAUTH_REQUIRED: connect your Go High Level sub-account to complete this purchase';
  end if;
end $$;

create or replace function public.stripe_session_params(
  p_checkout public.stripe_checkouts, p_origin text, p_email text)
returns jsonb language plpgsql immutable as $$
declare
  v_params jsonb := jsonb_build_object(
    'mode', 'payment',
    'submit_type', 'pay',
    'client_reference_id', p_checkout.id,
    'customer_email', p_email,
    'success_url', p_origin || '/checkout/complete/' || p_checkout.id,
    'cancel_url', p_origin || '/checkout?license=' || (p_checkout.items->0->>'license_id') || '&canceled=1',
    'metadata[checkout_id]', p_checkout.id,
    'metadata[terms_version]', p_checkout.terms_version,
    'payment_intent_data[metadata][checkout_id]', p_checkout.id,
    'payment_intent_data[description]', 'DesignPulse order ' || p_checkout.id);
  v_item jsonb;
  i int := 0;
begin
  for v_item in select * from jsonb_array_elements(p_checkout.items) loop
    v_params := v_params || jsonb_build_object(
      format('line_items[%s][quantity]', i), 1,
      format('line_items[%s][price_data][currency]', i), p_checkout.currency,
      format('line_items[%s][price_data][unit_amount]', i), v_item->>'price_cents',
      format('line_items[%s][price_data][product_data][name]', i),
        (v_item->>'title') || ' (' || initcap(v_item->>'tier') || ' license)',
      format('line_items[%s][price_data][product_data][metadata][asset_id]', i), v_item->>'asset_id');
    i := i + 1;
  end loop;
  return v_params;
end $$;

create or replace function public.start_checkout(
  p_license_ids uuid[], p_ghl_connection_id uuid, p_origin text, p_terms_version text)
returns text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_buyer uuid := auth.uid();
  v_items jsonb;
  v_checkout public.stripe_checkouts%rowtype;
  v_session jsonb;
begin
  if v_buyer is null then raise exception 'Not authenticated'; end if;
  perform public.assert_checkout_origin(p_origin);
  if p_terms_version is distinct from public.current_terms_version() then
    raise exception 'TERMS_REQUIRED: accept the current Terms of Sale to continue';
  end if;
  v_items := public.checkout_line_items(p_license_ids);
  perform public.assert_checkout_allowed(v_items, p_ghl_connection_id, v_buyer);

  insert into stripe_checkouts (buyer_id, items, ghl_connection_id, amount_cents, terms_version)
  values (v_buyer, v_items, p_ghl_connection_id,
    (select sum((x->>'price_cents')::int) from jsonb_array_elements(v_items) x), p_terms_version)
  returning * into v_checkout;

  v_session := public.stripe_api('POST', 'checkout/sessions',
    public.stripe_session_params(v_checkout, p_origin,
      (select email from auth.users where id = v_buyer)),
    'dp_checkout_' || v_checkout.id);
  update stripe_checkouts
    set stripe_session_id = v_session->>'id', livemode = (v_session->>'livemode')::boolean
    where id = v_checkout.id;
  return v_session->>'url';
end $$;

create or replace function public.new_license_key()
returns text language sql volatile
set search_path = public, extensions
as $$
  with k as (select upper(encode(gen_random_bytes(8), 'hex')) h)
  select 'DP-' || substr(h, 1, 4) || '-' || substr(h, 5, 4) || '-'
              || substr(h, 9, 4) || '-' || substr(h, 13, 4) from k
$$;

-- Same splits as the old checkout(): first-party is 100% Gambix, third-party
-- uses the seller's commission_rate. Uses the price locked at checkout.
create or replace function public.add_order_item(
  p_order uuid, p_buyer uuid, p_item jsonb, p_ghl uuid)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_asset assets%rowtype;
  v_price int := (p_item->>'price_cents')::int;
  v_rate numeric := 1.0;
  v_commission int;
  v_item_id uuid;
begin
  select * into v_asset from assets where id = (p_item->>'asset_id')::uuid;
  if not v_asset.is_first_party then
    select coalesce(commission_rate, 0.15) into v_rate from seller_profiles where id = v_asset.seller_id;
    v_rate := coalesce(v_rate, 0.15);
  end if;
  v_commission := round(v_price * v_rate);

  insert into order_items (order_id, asset_id, seller_id, license_tier, price_cents,
    commission_cents, seller_earnings_cents)
  values (p_order, v_asset.id, v_asset.seller_id, (p_item->>'tier')::license_tier, v_price,
    v_commission, v_price - v_commission)
  returning id into v_item_id;

  insert into license_keys (order_item_id, buyer_id, asset_id, key)
  values (v_item_id, p_buyer, v_asset.id, public.new_license_key());

  if p_item->>'platform' = 'ghl' then
    insert into ghl_imports (order_item_id, connection_id) values (v_item_id, p_ghl);
  else
    insert into download_tokens (order_item_id, token, expires_at)
    values (v_item_id, encode(gen_random_bytes(24), 'hex'), now() + interval '72 hours');
  end if;
  update assets set sales_count = sales_count + 1 where id = v_asset.id;
end $$;

create or replace function public.complete_checkout(
  p_checkout public.stripe_checkouts, p_payment_intent text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_item jsonb;
begin
  insert into orders (buyer_id, total_cents, status, payment_ref)
  values (p_checkout.buyer_id, p_checkout.amount_cents, 'paid', p_payment_intent)
  returning id into v_order;
  for v_item in select * from jsonb_array_elements(p_checkout.items) loop
    perform public.add_order_item(v_order, p_checkout.buyer_id, v_item, p_checkout.ghl_connection_id);
  end loop;
  update stripe_checkouts
    set status = 'complete', order_id = v_order, stripe_payment_intent = p_payment_intent,
        completed_at = now()
    where id = p_checkout.id;
  return v_order;
end $$;

create or replace function public.stripe_session_paid(
  p_session jsonb, p_checkout public.stripe_checkouts)
returns boolean language plpgsql immutable as $$
begin
  if p_session->>'payment_status' <> 'paid' then return false; end if;
  if p_session->>'client_reference_id' is distinct from p_checkout.id::text
     or (p_session->>'amount_total')::int is distinct from p_checkout.amount_cents
     or p_session->>'currency' is distinct from p_checkout.currency then
    raise warning 'Stripe session % does not match checkout %', p_session->>'id', p_checkout.id;
    return false;
  end if;
  return true;
end $$;

-- Public on purpose: the webhook calls it anonymously and the success page
-- calls it as the buyer. It never trusts the caller, only Stripe's answer.
-- Returns the order id once paid, null while payment is still pending.
create or replace function public.fulfill_checkout(p_checkout_id uuid)
returns uuid
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v_checkout public.stripe_checkouts%rowtype;
  v_session jsonb;
begin
  select * into v_checkout from stripe_checkouts where id = p_checkout_id for update;
  if not found or v_checkout.stripe_session_id is null then return null; end if;
  if v_checkout.status <> 'open' then return v_checkout.order_id; end if;

  v_session := public.stripe_api('GET', 'checkout/sessions/' || v_checkout.stripe_session_id);
  if v_session->>'status' = 'expired' then
    update stripe_checkouts set status = 'expired' where id = v_checkout.id;
    return null;
  end if;
  if not public.stripe_session_paid(v_session, v_checkout) then return null; end if;
  return public.complete_checkout(v_checkout, v_session->>'payment_intent');
end $$;

revoke execute on function public.stripe_api(text, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.assert_checkout_origin(text) from public, anon, authenticated;
revoke execute on function public.checkout_line_items(uuid[]) from public, anon, authenticated;
revoke execute on function public.assert_checkout_allowed(jsonb, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.stripe_session_params(public.stripe_checkouts, text, text) from public, anon, authenticated;
revoke execute on function public.new_license_key() from public, anon, authenticated;
revoke execute on function public.add_order_item(uuid, uuid, jsonb, uuid) from public, anon, authenticated;
revoke execute on function public.complete_checkout(public.stripe_checkouts, text) from public, anon, authenticated;
revoke execute on function public.stripe_session_paid(jsonb, public.stripe_checkouts) from public, anon, authenticated;

revoke execute on function public.start_checkout(uuid[], uuid, text, text) from public, anon;
grant execute on function public.start_checkout(uuid[], uuid, text, text) to authenticated;
grant execute on function public.fulfill_checkout(uuid) to anon, authenticated;
grant execute on function public.current_terms_version() to anon, authenticated;
