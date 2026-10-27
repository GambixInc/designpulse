# DesignPulse AI Hub: strategy (2026-10-27)

The owner asked for an AI hub built on what is trending and defensible. This
is the reasoning, the first product and the build order. The storefront page
is `/ai`; the waitlist is `public.ai_waitlist` (admin-read only).

## What is trending (October 2026)

- **HighLevel AI Employee.** Voice AI, Conversation AI and workflow AI are a
  per-sub-account add-on, and HighLevel lets agency owners list Conversation
  AI and Voice AI agent templates on its marketplace, bundled with knowledge
  bases, workflows, calendars and custom fields. Agencies are actively buying
  these templates.
- **AI receptionists for trades.** A crowded SaaS category (plumbing, HVAC,
  electrical, home services) at roughly $49 to $299 a month, selling emergency
  triage, booking and missed-call text-back. Restoration is thinly served.
- **Agent skills, MCP servers and n8n workflows.** Fast-growing but flooded
  with free supply (hundreds of free Claude skills, thousands of free n8n
  templates). Weak pricing power for generic items.
- **AI search.** Buyers increasingly ask ChatGPT, Gemini, Perplexity and
  Google's AI answers which local business to call; structured data and
  answer-first content decide who gets named.

## What is defensible for us

Generic prompts, skills and workflows are commodities. What competitors cannot
copy cheaply is the combination DesignPulse already has:

1. **Trade depth.** Each kit is written for one trade's real calls (what is an
   emergency, which questions separate a small job from a large one, what an
   agent must never promise). Restoria's copy already "speaks adjuster"; the
   agent should too.
2. **One system.** The website template's forms, the GHL snapshot's pipeline
   stages and the agent's hand-offs are designed together. Template sellers
   sell only the site; AI receptionist vendors sell only the phone.
3. **Owned, not rented.** A one-time license instead of another monthly seat.
   The buyer pays HighLevel for usage directly.
4. **Compliance in the box.** TCPA treats AI voices as artificial voices,
   A2P 10DLC is mandatory for business texting, several states need
   all-party recording consent, and AI disclosure rules are spreading. Kits
   ship consent wording, disclosure lines, recording notices and an A2P
   checklist. This is a real buyer fear and a real differentiator, and the
   Acceptable use & AI policy already backs it.
5. **Two storefronts.** Sell on DesignPulse and list the same agent templates
   on the HighLevel marketplace, as with Wix.

## Product lines

| Line | Status | Notes |
|---|---|---|
| AI Front Desk kits (GHL Voice AI + Conversation AI, KB, workflows) | First kit in build: Restoria | The hero product |
| AI-search-ready sites (schema, answer-first FAQs, llms.txt) | Coming to every template | A feature that lifts every template, not a separate SKU |
| Agency AI toolkit (prompts/skills that re-skin a template per client) | Planned | Low price, bundle with Extended licenses |
| Done-for-you AI setup | Early access | Folds into the `/white-label` service tiers |

Pricing hypotheses to test with the waitlist, not yet promised anywhere:
kit Standard (one sub-account) about $297, Extended (unlimited sub-accounts)
about $997, template plus kit bundle at a discount, done-for-you setup in the
$1,200 white-label tier.

## First product: Restoria AI Front Desk

Pairs with the Restoria Wix template.

- **Voice AI receptionist**: answers 24/7; triages water, fire, smoke, mold
  and storm calls; asks whether water is still running, which room, how long
  it has been wet, whether there is a ceiling bulge or electrical risk;
  books an inspection or escalates a live emergency to the on-call tech by
  call transfer and SMS.
- **Insurance-aware script**: asks for carrier and whether a claim is open,
  explains the documentation the company provides, never states what a policy
  covers or estimates a payout.
- **Conversation AI** for SMS, web chat, Facebook and Instagram with the same
  knowledge base.
- **Workflows**: missed-call text-back, website form to "New loss" pipeline
  stage with consent captured, post-job review request, and a 48-hour "how is
  the drying going" check-in.
- **Compliance pack**: consent text matching the template's forms, AI
  disclosure opener, recording notice, A2P campaign description, STOP
  handling, after-hours rules.
- **Go-live checklist**: services, service area, hours, on-call numbers,
  hand-off rules, ten scripted test calls.

Delivery: a GHL snapshot plus agent template, through the existing
`ghl_imports` flow once the real GHL Snapshot API replaces the simulation
(CLAUDE.md TODO 4), with a share-link fallback. Listing it needs a new
category (or `platform_type` value) for AI kits and a real package in
`asset_packages`.

## Build order

1. Read the waitlist (`select interest, trade, count(*) from ai_waitlist
   group by 1, 2`) to confirm the first trade and price.
2. Write the Restoria kit content in the studio repo area (prompts, KB,
   scripts, compliance pack) and build it in a GHL sandbox sub-account.
3. Add the AI-kit category and listing; deliver through the snapshot flow.
4. List the agent template on the HighLevel marketplace.
5. Repeat for Overhead and Sentris, then the next trades from NEXT-PHASE.md.
6. Add schema, answer-first FAQs and llms.txt to the three Wix templates.

## Sources

- HighLevel: listing Conversation AI and Voice AI templates on the marketplace
  (help.gohighlevel.com, article 155000005412) and the marketplace module docs
  (marketplace.gohighlevel.com).
- AI Employee pricing roundup, checked 1 October 2026 (ghlscaleup.com,
  havstock.com): treat prices as indicative.
- Agent marketplace and tooling stats (keyflowhub.com/stats, agensi.io):
  vendor sources, indicative only.
- Trade AI receptionist roundups (lunacal.ai, dapta.ai, getnextphone.com):
  vendor sources; missed-call figures vary widely and are not quoted on the
  site.
