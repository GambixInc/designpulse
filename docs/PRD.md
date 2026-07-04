# DesignPulse — Product Requirements Document

## 1. Product Overview
DesignPulse is a two-sided digital asset marketplace built and operated by Gambix, selling design templates and (later) plugins for Wix Studio, Webflow, WordPress, and Shopify, plus GHL (Go High Level) snapshots and funnel assets. Gambix seeds the initial catalog with first-party assets, then opens the platform to vetted third-party sellers, taking a flat 15% commission on all third-party sales. The platform launches with simple preview + download delivery (no live in-browser editor) to prioritize speed to market.

## 2. Business Model
- **Revenue streams**: Direct sales of Gambix first-party templates/plugins (100% margin) + 15% commission on all third-party marketplace sales
- **Pricing structure**: Per-item purchase (one-time), no subscription at launch — subscription/bundle passes can be a Phase 2 feature
- **License tiers per item**: Standard license (single end product, single domain) and Extended license (multi-use / client resale rights), priced separately — this mirrors ThemeForest's proven model
- **Commission**: 15% flat platform fee on all seller transactions, deducted automatically at time of sale via Stripe Connect application fees

## 3. Catalog Structure at Launch

| Category | Platform | Asset types | Launch phase |
|---|---|---|---|
| Website templates | Wix Studio | Full site templates, section templates | Launch (Phase 1) |
| Website templates | Webflow | Full site templates, component libraries | Launch (Phase 1) |
| Website templates | WordPress | Themes, page builder templates (Elementor/Divi compatible) | Launch (Phase 1) |
| E-commerce templates | Shopify | Full themes, section templates | Launch (Phase 1) |
| CRM/automation assets | Go High Level | Snapshots, funnel templates, automation workflows | Launch (Phase 1) |
| Plugins | Cross-platform | Utility plugins, extensions | Phase 2 (coming soon) |

Gambix seeds each launch category with an initial batch of first-party assets (recommend 15-25 per platform category, 75-125 total) before opening seller applications, to ensure the marketplace never looks empty on day one.

## 4. Core User Roles
- **Buyer**: Browses, previews, purchases, downloads, manages licenses, leaves reviews
- **Seller**: Applies, uploads assets, manages storefront, tracks sales/payouts, responds to buyer questions
- **Gambix Admin**: Reviews submissions, manages disputes, monitors quality metrics, configures commission/licensing rules, manages featured/curated placements

## 5. Buyer Experience
- **Discovery**: Search with filters by platform (Wix Studio/Webflow/WordPress/Shopify/GHL), category, price range, license type, rating, "new" and "trending" sorting
- **Product page**: Watermarked live preview or demo link, feature list, compatibility notes (platform version, required plugins/apps), license options with pricing, seller profile link, ratings/reviews, FAQ section
- **Checkout**: Stripe-hosted checkout, license selection at point of purchase, instant order confirmation
- **Post-purchase**: Tokenized, time-limited download link delivered via email + buyer dashboard; license key generated and displayed; GHL snapshot assets deliver via one-click "Import to My Sub-Account" flow instead of file download (see Section 8)
- **Buyer dashboard**: Purchase history, re-download access (with refreshed tokens), license keys, support ticket submission, wishlist

## 6. Seller Experience
- **Application**: Portfolio samples, platform specialty selection, business/tax info collection
- **Onboarding**: Stripe Express account setup (identity verification, bank details handled by Stripe, not built in-house)
- **Upload flow**: Asset file upload, category/tag selection, pricing per license tier, description, screenshots, required compatibility metadata (platform version, dependencies)
- **Seller dashboard**: Sales analytics (units sold, revenue, refund rate), payout history and schedule, review management, support inbox, resubmission flow for rejected items

## 7. Trust & Quality Control System (Custom-Built, Multi-Layer)
This is the platform's core differentiator versus ThemeForest, which is widely criticized for inconsistent quality gatekeeping.

### Layer 1 — Automated pre-check (runs on every upload)
- Malware/virus scanning on all uploaded files
- Broken link and broken image detection
- File structure and packaging validation (correct folder structure, required files present)
- Code linting for WordPress/Shopify themes (deprecated functions, known security vulnerabilities, coding standards compliance)
- Duplicate/plagiarism detection against existing catalog (image hash comparison + code similarity check)
- Platform-specific automated compliance checks (Shopify theme store technical requirements, WordPress coding standards, Webflow/Wix structural validation)

### Layer 2 — Human review (Gambix reviewer team)
- Documented scoring rubric: visual design quality, responsiveness/mobile testing across breakpoints, cross-browser compatibility, code quality/cleanliness, documentation completeness, originality/uniqueness
- Pass/fail/revise-and-resubmit outcome with specific reviewer notes returned to seller
- Target review SLA: 3-5 business days for new submissions

### Layer 3 — Seller tiering
- **Probationary tier**: All new sellers start here; every submission gets full Layer 1 + Layer 2 review
- **Trusted tier**: Sellers with 10+ approved items, average rating 4.5+, and refund rate under 5% graduate here; get expedited review (Layer 1 automated only, spot-check human review)
- **Elite/Exclusive tier**: Top sellers who agree to list exclusively on DesignPulse get reduced commission (e.g., 10% instead of 15%) as an incentive, mirroring ThemeForest's exclusive author model

### Layer 4 — Post-launch monitoring
- Automated tracking of per-item and per-seller refund rates, complaint rates, and review scores
- Threshold-based auto-flagging: any item exceeding a set refund/complaint rate triggers automatic re-review or temporary delisting pending investigation
- Lightweight re-check (Layer 1 automated only) on every file update to an existing live listing, to catch broken updates before they reach buyers

## 8. GHL Asset Delivery (Technical Spec)
Unlike file-based templates, GHL snapshots must be delivered via API import rather than download, since snapshots are account-level configurations (funnels, workflows, pipelines, custom values).

- **Delivery mechanism**: Use GHL's Snapshot API endpoint (`POST /v1/locations/{locationId}/snapshots/load`) to programmatically push a purchased snapshot directly into the buyer's connected GHL sub-account, with selective restore options so buyers can choose which components to import
- **Buyer flow**: After purchase, buyer connects their GHL sub-account via OAuth, selects target sub-account, reviews snapshot contents, confirms import, and the system handles conflict-checking automatically (mirroring GHL's native load-snapshot conflict resolution flow)
- **Fallback option**: If a buyer cannot connect via API (e.g., permissions issue), provide a manual snapshot share-link delivery as backup, per GHL's standard sharing method
- **Versioning**: Sellers must be able to push updates to a snapshot; buyers who previously purchased get notified and can choose to re-import updated components without overwriting existing custom data

## 9. DRM & Watermarking (Day-One Requirement)
- **Visual asset protection**: All preview images and live demo links display visible or overlay watermarking; live demos limit interaction (view-only, no source inspection/download shortcuts)
- **License key system**: Every purchase generates a unique license key tied to buyer account, and where applicable, to a specific domain (critical for WordPress/Shopify theme activation checks)
- **Secure file delivery**: All downloads use time-limited, tokenized URLs (not permanent public links); tokens expire after a set window (e.g., 72 hours) or number of downloads, and buyers can regenerate fresh tokens anytime from their dashboard
- **Code protection**: Optional light obfuscation for premium/paid components in WordPress/Shopify theme files to deter unauthorized redistribution while keeping core customization points editable per license terms
- **Enforcement**: Automated fingerprinting of purchased files to detect unauthorized redistribution if reported/flagged by sellers or Gambix monitoring

## 10. Payment & Payout Architecture (Stripe Connect)
- **Account model**: Stripe Express accounts for all sellers — Stripe handles KYC/identity verification and provides sellers a simple hosted dashboard, minimizing custom build effort
- **Charge type**: Destination charges — buyer pays full listed price, Stripe automatically routes 85% to the seller's connected account and retains 15% as Gambix's application fee
- **Payout schedule**: Rolling hold period (recommend 7-14 days) before funds release to seller, to protect against refund/chargeback exposure
- **Fee modeling**: Standard Stripe processing fees (2.9% + $0.30 per transaction) plus per-payout fees on connected accounts apply on top — model the 15% take rate net of these processing costs, not gross
- **Risk management**: Enable Stripe Radar for Platforms from launch, since Gambix as merchant of record is liable for covering negative balances from disputes/refunds on connected seller accounts

## 11. Refund Policy (Recommended Default)
- Refunds granted only for verifiable technical defects (file corruption, non-functional core features, major compatibility misrepresentation) — not for "change of mind" or buyer implementation difficulty
- Refund window: 7 days from purchase
- Refund requests route through a support ticket reviewed by Gambix admin, not automatic self-service, to prevent abuse
- Approved refunds reverse the seller's earned commission for that transaction; repeated refund issues on a seller's items trigger Layer 4 quality re-review

## 12. Admin/Moderation Dashboard (Gambix Internal Tool)
- Submission review queue (Layer 1 automated results + Layer 2 human review interface)
- Seller tier management (manual override capability)
- Dispute/refund resolution center
- Commission and licensing rule configuration
- Platform-wide analytics: GMV, top categories, top sellers, refund rates, conversion rates
- Featured/curated placement controls for homepage and category pages

## 13. Phase 2 Roadmap (Post-Launch)
- Plugin marketplace expansion (cross-platform utility plugins)
- Exclusive seller tier with reduced commission
- Subscription/bundle pass option (unlimited access to Gambix first-party catalog)
- Lightweight in-browser customizer (colors/fonts/copy) as a stretch differentiator once core marketplace is stable

## 14. Open Items Requiring Final Decision
- Exact reviewer team structure (in-house Gambix staff vs. contracted reviewers via Fiverr, which fits existing platform usage)
- Final refund window length (7 vs. 14 days) — recommend testing at 7 days initially
- Whether GHL OAuth connection is required at checkout or can be deferred to first-use, to reduce checkout friction
