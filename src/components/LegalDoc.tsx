import Link from "next/link";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";

type LegalDocProps = {
  title: string;
  summary: string;
  path: string;
  children: React.ReactNode;
};

/** Shared frame for the legal pages: title, plain-English summary, sibling nav. */
export default function LegalDoc({ title, summary, path, children }: LegalDocProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 grid gap-10 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Legal pages" className="lg:sticky lg:top-24 self-start">
        <p className="text-xs font-semibold uppercase tracking-wider text-faint mb-3">Legal</p>
        <ul className="space-y-2 text-sm">
          {LEGAL_PAGES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={p.href === path ? "page" : undefined}
                className={p.href === path ? "text-ink font-medium" : "text-muted hover:text-ink"}
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm text-faint">
          Effective {LEGAL.effectiveDate} · {LEGAL.entity}
        </p>
        <div className="card p-5 mt-6 text-sm text-muted">
          <span className="font-medium text-ink">In short: </span>
          {summary}
        </div>
        <div className="mt-8 space-y-8">{children}</div>
        <ContactBlock />
      </article>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function ContactBlock() {
  return (
    <section className="mt-10 border-t border-line pt-6 text-sm text-muted">
      <h2 className="font-semibold text-ink">Contact</h2>
      <p className="mt-2">
        {LEGAL.brand} is operated by {LEGAL.entity}
        {LEGAL.mailingAddress ? `, ${LEGAL.mailingAddress}` : ""}.
      </p>
      <p className="mt-1">
        {LEGAL.contactEmail ? (
          <>
            Email:{" "}
            <a href={`mailto:${LEGAL.contactEmail}`} className="text-accent hover:underline">
              {LEGAL.contactEmail}
            </a>
          </>
        ) : (
          "Our support and legal contact address is being set up and will be listed here."
        )}
      </p>
    </section>
  );
}
