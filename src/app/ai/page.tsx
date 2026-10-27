import Link from "next/link";
import AiWaitlistForm from "@/components/AiWaitlistForm";
import { AI_LINES } from "@/lib/ai-hub";

export const metadata = {
  title: "AI Hub — DesignPulse",
  description:
    "AI front-desk kits, AI-search-ready sites and agency AI tools for local service businesses, built per trade and sold as templates you own.",
};

const STEPS: [string, string][] = [
  ["Pick the trade", "Start from the website template for the trade, so the site, pipeline and agent speak the same language."],
  ["Connect the sub-account", "The kit loads into your Go High Level sub-account: agent, knowledge base, calendars and workflows."],
  ["Tune and test", "A go-live checklist walks through services, service area, hand-off rules, consent and test calls."],
  ["Go live", "Calls and messages are answered, triaged and booked; anything the agent should not handle goes to a person."],
];

const MOATS: [string, string][] = [
  ["Built per trade, not per prompt", "Each kit is written for one trade’s real calls: the emergencies, the questions that sort a $90 visit from a $9,000 job, and what the agent must never promise."],
  ["Compliance in the box", "Consent wording on every form, AI disclosure lines, recording notices and an A2P 10DLC checklist ship with the kit, because TCPA rules apply to AI voices."],
  ["Owned, not rented", "A one-time license instead of another per-seat AI receptionist subscription. You pay HighLevel for usage directly, with no markup from us."],
  ["Site, pipeline and agent designed together", "The template’s forms, the snapshot’s pipeline stages and the agent’s hand-offs are one system, which single-purpose template sellers and AI tools do not offer."],
];

export default function AiHubPage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="pt-20 pb-12 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          DesignPulse AI Hub · early access
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink">
          The AI front desk
          <br />
          <span className="text-accent">for the trades.</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-muted text-lg">
          Voice and chat agents, knowledge bases and follow-up workflows written for
          one trade at a time, and paired with the website template that feeds them.
        </p>
        <a href="#early-access" className="btn-primary mt-8 px-7 py-3 text-base">
          Get early access
        </a>
      </section>

      <section className="py-10 grid gap-5 md:grid-cols-2" aria-label="Product lines">
        {AI_LINES.map((line) => (
          <article key={line.id} className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">{line.name}</h2>
              <span className="badge border-line text-muted">{line.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{line.pitch}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-ink">
              {line.ships.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-accent" aria-hidden>✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink text-center">How a kit goes live</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="card p-5">
              <span className="text-xs font-semibold text-accent">Step {i + 1}</span>
              <p className="mt-1 font-medium text-ink">{title}</p>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink text-center">Why this, and why from us</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {MOATS.map(([title, body]) => (
            <div key={title} className="card p-5">
              <p className="font-medium text-ink">{title}</p>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="early-access" className="py-14 grid gap-8 md:grid-cols-2 items-start scroll-mt-24">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Early access</h2>
          <p className="mt-3 text-muted">
            The first kit pairs with{" "}
            <Link href="/asset/restoria-restoration" className="text-accent hover:underline">
              Restoria
            </Link>
            , our restoration-contractor template. Tell us your trade and we will build
            in the order people ask for.
          </p>
          <p className="mt-3 text-sm text-faint">
            Running AI calls or texts? Read the{" "}
            <Link href="/legal/acceptable-use" className="text-accent hover:underline">
              Acceptable use &amp; AI policy
            </Link>{" "}
            first.
          </p>
        </div>
        <AiWaitlistForm />
      </section>
    </div>
  );
}
