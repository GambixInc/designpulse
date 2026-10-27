-- Security advisor follow-ups (2026-10-27).
--
-- 1. Pin search_path on the checkout helpers that are not security definer.
--    They only use built-ins, so an empty path changes nothing but removes
--    the "role mutable search_path" warning.
alter function public.assert_checkout_origin(text) set search_path = '';
alter function public.stripe_session_params(public.stripe_checkouts, text, text) set search_path = '';
alter function public.stripe_session_paid(jsonb, public.stripe_checkouts) set search_path = '';
alter function public.current_terms_version() set search_path = '';

-- 2. RPCs that only make sense for a signed-in user. Each already rejects a
--    missing auth.uid() inside, so this is defence in depth: anonymous calls
--    now stop at the permission check. PUBLIC is revoked too because anon
--    inherits from it.
--
--    Deliberately left callable anonymously:
--    use_download_token (the token is the bearer; /api/download is anonymous),
--    fulfill_checkout (Stripe webhook; it only trusts Stripe's answer),
--    is_admin / is_reviewer (RLS policies evaluate them for anonymous reads),
--    current_terms_version.
do $$
declare f regprocedure;
begin
  foreach f in array array[
    'public.apply_as_seller(text, text, text, public.platform_type[])',
    'public.confirm_ghl_import(uuid, jsonb)',
    'public.connect_ghl_account(text)',
    'public.regenerate_download_token(uuid)',
    'public.request_refund(uuid, public.refund_reason, text, jsonb)',
    'public.resolve_refund(uuid, boolean, text)',
    'public.review_seller_application(uuid, boolean)',
    'public.review_submission(uuid, public.submission_outcome, text, jsonb, text)',
    'public.run_ghl_conflict_check(uuid)',
    'public.submit_asset(uuid)'
  ]::regprocedure[]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
