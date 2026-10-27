# Switching on real payments

Checkout is real Stripe Checkout, with the work done in Postgres:

- `start_checkout(license_ids, ghl_connection_id, origin, terms_version)` prices
  the cart from `asset_licenses`, records which Terms version the buyer
  accepted, creates a Stripe Checkout Session through the `http` extension and
  returns its URL. The browser only sends license ids.
- `fulfill_checkout(checkout_id)` asks Stripe whether the session is paid,
  checks the amount, currency and reference match, then creates the order,
  license key and download token. It is idempotent and trusts nobody but
  Stripe, so the success page (as the buyer) and the webhook (anonymously)
  both call it.
- The Stripe key lives only in Supabase Vault as `stripe_secret_key`. There is
  no Stripe key in Vercel, in the repo or in the browser, and no service-role
  key anywhere.
- Third-party seller items cannot be bought until Stripe Connect payouts exist
  (`THIRD_PARTY_UNAVAILABLE`).
- Refunds stay manual: approving a ticket on `/review` records it; the admin
  then refunds the payment in the Stripe Dashboard (the ticket links to it).

Code: `supabase/migrations/20261027120000_stripe_checkout.sql`,
`src/app/checkout/page.tsx`, `src/app/checkout/complete/[checkoutId]/page.tsx`,
`src/app/api/stripe/webhook/route.ts`, `src/lib/stripe-webhook.ts`.

## Owner steps (in order)

Everything here is an owner-only action: logins, key entry, terms and live
payments.

1. **Apply the migrations.** `stripe_checkout` and `ai_waitlist` are additive
   and safe to apply before deploying. Apply `retire_simulated_checkout` in the
   same window as the deploy: it revokes the old `checkout()` RPC, which gives
   away real Wix delivery links without payment.
2. **Create an admin account.** All demo accounts are banned. Sign up at
   `/login` with gambixa@gmail.com (the `handle_new_user` trigger makes that
   address an admin) and confirm the email.
3. **Stripe, test mode first.** In the Stripe Dashboard (sandbox):
   - Developers > API keys > Create restricted key, named "DesignPulse
     Postgres". Permissions: Checkout Sessions **Write**, Products **Write**,
     Prices **Write**; everything else None. After the first test purchase,
     open the key's request log and add any permission a `403` names.
   - Settings > Public details: business name, support email, statement
     descriptor (e.g. `DESIGNPULSE`).
   - Settings > Customer emails: turn on receipts for successful payments.
4. **Put the key in Vault.** In the Supabase SQL editor:

   ```sql
   select vault.create_secret('rk_test_...', 'stripe_secret_key',
     'DesignPulse checkout restricted key');
   ```

   Rotate later with:

   ```sql
   select vault.update_secret(
     (select id from vault.secrets where name = 'stripe_secret_key'),
     'rk_live_...');
   ```

5. **Webhook.** Developers > Webhooks > Add endpoint
   `https://designpulse-seven.vercel.app/api/stripe/webhook` with events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   and `checkout.session.expired`. Copy the signing secret into Vercel as
   `STRIPE_WEBHOOK_SECRET` (Production), then redeploy. Without it the route
   returns 503 and Stripe retries; the success page still fulfils orders.
6. **Test purchase** with card `4242 4242 4242 4242` on a preview or local
   build (allowed origins: production, `designpulse-*-gambix1.vercel.app`,
   `http://localhost:*`). Check the order, license key and Wix link arrive in
   the library, then refund it in Stripe and approve the ticket on `/review`.
7. **Go live**: repeat steps 3 to 5 in live mode with a live restricted key
   and a live webhook endpoint, and `vault.update_secret` to the live key.

## Before the first real sale

- Fill `governingState`, `mailingAddress` and `contactEmail` in
  `src/lib/legal.ts`. The legal pages say plainly that contact details are
  coming until then.
- Have counsel review the legal pages. They are written to be defensible, not
  as legal advice.
- Register a DMCA designated agent with the US Copyright Office
  (dmca.copyright.gov) to keep safe-harbor protection for seller uploads.
- Decide on sales tax. Stripe Tax is not switched on; Terms section 4 makes
  buyers responsible unless tax is collected at checkout.
- Adding a custom domain means adding it to `assert_checkout_origin()`.
- Changing the Terms means bumping both `current_terms_version()` in Postgres
  and `LEGAL.termsVersion`.
