/**
 * Who sells on DesignPulse, used by every legal page and the footer.
 *
 * The three null fields are for the owner to fill before sales open. Until
 * then the pages say so plainly instead of showing made-up details.
 */
export const LEGAL = {
  entity: "Gambix LLC",
  brand: "DesignPulse",
  /** US state where Gambix LLC is organized, e.g. "Maryland". */
  governingState: null as string | null,
  /** Postal address for legal notices and DMCA notices. */
  mailingAddress: null as string | null,
  /** Inbox for support, privacy requests and legal notices. */
  contactEmail: null as string | null,
  /** Keep in step with public.current_terms_version() in Postgres. */
  termsVersion: "2026-10-27",
  effectiveDate: "October 27, 2026",
};

export const LEGAL_PAGES: { href: string; label: string }[] = [
  { href: "/legal/terms", label: "Terms of Service & Sale" },
  { href: "/legal/license", label: "License agreement" },
  { href: "/legal/refunds", label: "Refund policy" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/acceptable-use", label: "Acceptable use & AI" },
  { href: "/legal/sellers", label: "Seller terms" },
];

export function governingLaw(): string {
  return LEGAL.governingState
    ? `the State of ${LEGAL.governingState}`
    : `the state in which ${LEGAL.entity} is organized`;
}

export function contactLine(): string {
  return LEGAL.contactEmail ?? "the contact address we publish on this page";
}
