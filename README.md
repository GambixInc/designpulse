# DesignPulse — MVP

Two-sided digital asset marketplace by Gambix. Built per the DesignPulse PRD (Phase 1).

**Live:** https://designpulse-seven.vercel.app

## Demo accounts (password: `designpulse-demo`)

| Role | Email | What to try |
|---|---|---|
| Buyer | buyer@designpulse.demo | Buy an asset → library → download / GHL import → review / refund |
| Seller | seller@designpulse.demo | Seller hub → upload asset → watch it enter the review queue |
| Admin | admin@designpulse.demo | Admin → review queue (1 pending), seller tiers, refunds, featured, GMV analytics |

Signing up with **gambixa@gmail.com** automatically grants the admin role.

## What's implemented (PRD mapping)

- **§3 Catalog**: 5 launch categories seeded with 20 Gambix first-party assets + 2 third-party demo assets; Plugins category staged for Phase 2
- **§5 Buyer**: search/filter/sort marketplace, watermarked previews, license tiers (Standard/Extended), simulated checkout, buyer library with re-downloadable tokenized links, license keys, reviews (verified buyers only), wishlist, refund requests
- **§6 Seller**: application flow, upload with compatibility metadata + per-tier pricing, dashboard with sales/earnings/refund-rate, submission history with reviewer notes
- **§7 Quality control**: Layer 1 automated pre-checks run at submission (simulated results, real scanners plug in), Layer 2 admin review with rubric scoring + pass/fail/revise, Layer 3 auto-tiering (10+ approved & 4.5+ rating → Trusted; Elite = 10% commission), Layer 4 refund-rate visibility + delisting
- **§8 GHL delivery**: simulated OAuth → sub-account select → selective restore → conflict check import flow; snapshot share-file fallback in download
- **§9 DRM**: overlay watermarks on previews, unique license keys, 72-hour / 5-use tokenized download URLs, regenerable from dashboard
- **§11 Refunds**: 7-day defect-only policy, admin-reviewed, reverses seller earnings
- **§12 Admin**: review queue, seller tier management, refund center, featured placement, GMV/revenue/refund-rate analytics

## What's stubbed (production TODOs)

1. **Stripe Connect** — checkout is simulated via the `checkout` Postgres RPC. Production: Stripe-hosted Checkout with destination charges + 15% `application_fee`, Express accounts for sellers, webhook (`payment_intent.succeeded`) calls the same order-creation logic. Stub points marked in `src/app/checkout/page.tsx` and `sell/page.tsx`.
2. **File storage** — downloads deliver a generated placeholder package. Production: seller uploads to private Supabase Storage; the download route streams the real package.
3. **Layer 1 scanners** — results are simulated inside the `submit_asset` RPC; wire real malware/lint/plagiarism scanners there.
4. **GHL API** — import modal simulates the flow; production calls `POST /v1/locations/{id}/snapshots/load` after real OAuth.
5. **Types** — Supabase query results are loosely typed in places; run `supabase gen types typescript` and replace the `any` mappings.

## Stack

Next.js 14 (App Router) · Tailwind · Supabase (Postgres + Auth + RLS, project `designpulse` / `lrebfcfrkobpjgwdvauq` in the Gambix org) · Vercel (project `designpulse`, team gambix1). All business logic lives in security-definer Postgres functions (`checkout`, `submit_asset`, `review_submission`, `resolve_refund`, …) so prices and commissions are enforced server-side under RLS.

## Local dev

```bash
npm install
npm run dev
```

Supabase URL + publishable key have safe defaults in `src/lib/supabase/config.ts` (override with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
