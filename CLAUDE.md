# DesignPulse — Claude Code Context

Two-sided digital asset marketplace by Gambix selling design templates (Wix Studio, Webflow, WordPress, Shopify) and Go High Level snapshots. Gambix seeds first-party assets; vetted third-party sellers pay a flat 15% commission. Full requirements: `docs/PRD.md`.

**Status:** Working MVP, deployed to production. Built in a Cowork session on 2026-07-03/04; extended on 2026-07-05 with the Framer-inspired design system (light default + dark toggle), the in-house review team module (reviewer role, 5-criterion rubric, staff-only audit log, /review desk), the hardened 7-day refund window (system-enforced via `request_refund`, change-of-mind auto-flag, proof uploads to the `refund-proofs` bucket, automatic commission/payout reversal, `seller_refund_metrics` view), the mandatory GHL OAuth checkout gate (`ghl_connections`, `ghl_imports`, conflict check before import confirm), per-platform delivery connector flows, and a seeded catalog of 16 first-party assets per launch category. This file is the complete handoff context.

## Live infrastructure

- **Production:** https://designpulse-seven.vercel.app
- **GitHub:** https://github.com/GambixInc/designpulse (public), connected to Vercel — pushing `main` auto-deploys to production. `gh` CLI authed as `Gambixteam` on this machine (scopes: repo, read:org); git push uses gh's credential helper.
- **Vercel:** project `designpulse`, team `gambix1` (Gambix). Linked via `.vercel/project.json`. Preferred deploy: `git push` (CI from GitHub). Manual fallback: `npx vercel deploy --prod --yes` (CLI logged in as `gambixteam`).
- **Supabase:** project `designpulse`, ref `lrebfcfrkobpjgwdvauq`, org `Gambix` (`nanuudiyoajywcfzsdnr`), region us-east-1, free tier. URL: https://lrebfcfrkobpjgwdvauq.supabase.co
- Supabase URL + anon key are hardcoded fallbacks in `src/lib/supabase/config.ts` (public by design, RLS enforces access). Env overrides: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **No service-role key is used anywhere.** All privileged operations are Postgres `security definer` RPCs. Keep it that way unless there's a strong reason.

## Demo accounts (password: `designpulse-demo`)

- `buyer@designpulse.demo` — buyer with purchases (incl. an imported GHL snapshot + a resolved refund)
- `seller@designpulse.demo` — approved seller "PixelForge Studio"
- `reviewer@designpulse.demo` — in-house reviewer "Riley Chen" (role `reviewer`: /review desk only, no admin)
- `admin@designpulse.demo` — Gambix admin (also has review-desk access)
- Direct-SQL demo users need the auth.users string token columns set to `''` (not NULL) or GoTrue sign-in 500s — bit us with the reviewer account.
- Signup with `gambixa@gmail.com` auto-grants admin (see `handle_new_user` trigger).
- Demo users were created via direct SQL inserts into `auth.users`/`auth.identities` (email-confirmed). Real signups go through Supabase email confirmation.

## Architecture

Next.js 14.2.35 (App Router, TS strict) + Tailwind 3 + `@supabase/ssr` cookie auth + jszip. Server components for storefront reads; client components for interactive dashboards calling Supabase directly under RLS.

**Business logic lives in Postgres functions** (security definer, so prices/commissions are server-enforced):

- `checkout(p_license_ids uuid[])` → creates order + items + license keys + 72h download tokens, updates sales counts. Commission: first-party = 100% to Gambix; third-party = seller's `commission_rate` (default 0.15, elite 0.10).
- `regenerate_download_token(p_order_item_id)` — buyer-owned check, new 72h token
- `use_download_token(p_token)` — validates/consumes token (called anonymously by download route; token is the bearer)
- `submit_asset(p_asset_id)` — seller submits; simulates Layer 1 automated pre-check results (jsonb), sets `pending_review`, creates submission
- `review_submission(id, outcome, notes, scores)` — admin Layer 2; pass/fail/revise; auto-promotes sellers to Trusted (10+ approved, 4.5+ avg)
- `apply_as_seller(...)`, `review_seller_application(id, approve)`, `resolve_refund(id, approve, notes)`
- `is_admin()` — used throughout RLS policies

**Schema** (all RLS-enabled): `profiles` (role: buyer/seller/admin, auto-created by trigger on auth.users), `seller_profiles` (tier: probationary/trusted/elite, commission_rate, stripe_account_id stub), `categories` (5 launch + plugins phase-2), `assets` (status: draft/pending_review/approved/rejected/delisted; `is_first_party`, `is_featured`, rating aggregates maintained by trigger), `asset_licenses` (standard/extended per asset), `submissions` (layer1_results jsonb, layer2_scores jsonb, outcome), `orders`, `order_items` (price/commission/seller_earnings split, refunded flag), `license_keys`, `download_tokens` (expires_at, max_uses 5), `reviews` (verified-buyer insert policy, unique per buyer+asset), `refund_requests`, `wishlists`.

Migrations were applied via the Supabase MCP (`designpulse_core_schema`, `designpulse_functions_triggers`, `designpulse_rls_policies`, `admin_seller_profile_management`, `fix_token_generation_search_path`). There is no local `supabase/migrations` directory yet — pulling the remote schema into version control (`supabase db pull`) would be a good early task.

## File map

- `src/app/page.tsx` — home (featured + trending)
- `src/app/marketplace/page.tsx` — browse with platform/rating filters, sort, search (filtering helper: `src/lib/queries.ts`)
- `src/app/asset/[slug]/page.tsx` + `BuyBox.tsx` — product page, license picker, wishlist
- `src/app/checkout/page.tsx` — simulated payment form → `checkout` RPC (Stripe stub point)
- `src/app/checkout/success/[orderId]/page.tsx`
- `src/app/dashboard/page.tsx` — buyer library: downloads, license keys, reviews, refunds, simulated GHL import modal (PRD §8 flow)
- `src/app/api/download/[token]/route.ts` — validates token via RPC, streams generated placeholder ZIP
- `src/app/sell/page.tsx` (application), `sell/dashboard/page.tsx` (analytics, submissions), `sell/upload/page.tsx` (upload → `submit_asset`)
- `src/app/admin/page.tsx` — seller tiers (+ refund-rate flags), refund queue, catalog/featured, GMV stats; Layer 2 review lives on the review desk
- `src/app/review/page.tsx` — reviewer/admin-only desk: submission queue with business-day SLA badges, 5-criterion rubric, seller feedback vs. staff-only internal notes, refund tickets, audit log
- `src/app/licenses/page.tsx` — Standard/Extended comparison + refund policy
- `src/components/DeliveryModal.tsx` — per-platform install connectors (Wix guided, Webflow clone link, WP demo importer, Shopify OAuth sim)
- `src/components/GhlImportFlow.tsx` — conflict check → confirm → snapshot push (RPCs: `run_ghl_conflict_check`, `confirm_ghl_import`)
- `src/components/RefundModal.tsx` — structured refund ticket (reason dropdown, proof upload, `request_refund` RPC)
- `src/app/login/page.tsx` — email/password + one-click demo accounts
- `middleware.ts` — Supabase session refresh (excludes `/api/download`)

New RPCs (2026-07-05): `request_refund`, `connect_ghl_account`, `run_ghl_conflict_check`, `confirm_ghl_import`, `is_reviewer`, `log_review_action` (internal-only; EXECUTE revoked from anon/authenticated). `checkout` now takes `p_ghl_connection_id` and refuses GHL items without it. `review_submission` takes `p_internal_note` (stored only in the staff-only `review_audit_log`). Design tokens are CSS variables in `globals.css` (light `:root` / `.dark`), mapped in `tailwind.config.ts` — use `ink/muted/faint/line/card/canvas/accent`, never raw slate/ink-950 classes.

## Known stubs / production TODOs (in priority order)

1. **Stripe Connect** — replace simulated checkout with Stripe-hosted Checkout (destination charges, 15% application fee), Express onboarding for sellers, webhook `payment_intent.succeeded` → reuse the `checkout` RPC logic. Stub comments in `checkout/page.tsx` and `sell/page.tsx`.
2. **Real file storage** — seller package upload to private Supabase Storage; download route streams the real file instead of a generated placeholder ZIP.
3. **Layer 1 scanners** — `submit_asset` fabricates results; wire real malware scan / link check / lint / plagiarism detection.
4. **GHL API** — import modal simulates OAuth + `POST /v1/locations/{id}/snapshots/load`; wire the real Snapshot API + share-link fallback.
5. **Types** — run `npx supabase gen types typescript --project-id lrebfcfrkobpjgwdvauq` and replace the `any` mappings in dashboard/admin client components.
6. Prompt()-based inputs in dashboard/admin should become proper forms/modals.
7. Seeded `rating_avg`/`rating_count` on first-party assets are display-only "imported ratings" (no review rows behind them).

## Code standards (owner's preferences)

- No `any` in TypeScript — use real types (see TODO 5)
- Functions under ~30 lines; extract logic duplicated more than twice
- Group 4+ component props into an object
- Error handling on every async operation

## Gotchas learned during the build

- `gen_random_bytes` lives in the `extensions` schema on Supabase — security definer functions need `set search_path = public, extensions`.
- Next 14.2.15 has a security vulnerability; pinned to 14.2.35.
- `@supabase/ssr` `setAll` callback params need explicit `CookieToSet[]` typing under strict TS.
- Embedded joins with two FKs to the same table need hints, e.g. `profiles!submissions_seller_id_fkey`.

## Commands

```bash
npm run dev            # local dev
npm run build          # typecheck + build (keep green)
npx vercel deploy --prod --yes   # deploy (already linked + authed)
```
