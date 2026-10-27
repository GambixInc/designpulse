import Link from "next/link";
import LegalDoc, { List, Section } from "@/components/LegalDoc";
import { LEGAL, governingLaw } from "@/lib/legal";
import { REFUND_WINDOW_DAYS } from "@/lib/format";

export const metadata = { title: "Terms of Service & Sale — DesignPulse" };

export default function TermsPage() {
  return (
    <LegalDoc
      path="/legal/terms"
      title="Terms of Service & Sale"
      summary={`You buy a license to use a digital product, not the product itself. Payment is handled by Stripe. Delivery is instant, so the ${REFUND_WINDOW_DAYS}-day refund window covers technical defects rather than change of mind. Platform accounts (Wix, Webflow, WordPress hosting, Shopify, HighLevel) are yours to hold and pay for.`}
    >
      <Section title="1. Who we are and what these terms cover">
        <p>
          {LEGAL.brand} is a marketplace for website templates, themes, Go High Level
          snapshots and related digital products, operated by {LEGAL.entity} (“Gambix”,
          “we”, “us”). These terms apply when you browse the site, create an account, buy,
          download or review a product. The{" "}
          <Link href="/legal/license" className="text-accent hover:underline">License agreement</Link>,{" "}
          <Link href="/legal/refunds" className="text-accent hover:underline">Refund policy</Link>,{" "}
          <Link href="/legal/acceptable-use" className="text-accent hover:underline">Acceptable use &amp; AI policy</Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="text-accent hover:underline">Privacy policy</Link>{" "}
          form part of these terms. Sellers are also bound by the{" "}
          <Link href="/legal/sellers" className="text-accent hover:underline">Seller terms</Link>.
        </p>
      </Section>

      <Section title="2. Your account">
        <List
          items={[
            "You must be at least 18, or the age of majority where you live, and able to enter a binding contract.",
            "Give accurate details and keep them current. Purchases, licenses and download links are tied to your account.",
            "Keep your password private. You are responsible for activity under your account; tell us promptly if you think it has been compromised.",
            "One person or business per account. Accounts and licenses cannot be sold or transferred without our written consent.",
          ]}
        />
      </Section>

      <Section title="3. What you are buying">
        <p>
          Every product is licensed, not sold. Your purchase gives you the rights in the
          license tier you choose (Standard or Extended) and nothing more; ownership of the
          product stays with Gambix or the seller.
        </p>
        <p>
          Products run on third-party platforms. You need your own account with the relevant
          platform, and any plan, hosting, app or usage fees it charges are yours. Those
          platforms set their own terms and can change their features at any time.{" "}
          {LEGAL.brand} is not affiliated with, endorsed by or sponsored by Wix.com,
          Webflow, the WordPress Foundation or Automattic, Shopify or HighLevel; their names
          and logos belong to them and are used only to describe compatibility.
        </p>
      </Section>

      <Section title="4. Prices, taxes and payment">
        <List
          items={[
            "Prices are in US dollars and are confirmed on the checkout page before you pay. The price charged is the price recorded in our system when you start checkout, not any amount sent from your browser.",
            "Payments are processed by Stripe. We never see or store your full card number.",
            "You are responsible for any sales tax, VAT or GST that applies to your purchase, unless it is calculated and collected at checkout.",
            "If a product is listed at an obviously wrong price, we may cancel the order and refund you in full.",
          ]}
        />
      </Section>

      <Section title="5. Delivery">
        <p>
          Delivery starts as soon as Stripe confirms your payment, usually within seconds.
          Your license key and delivery options appear in your library. Download links last
          72 hours and up to five uses, and you can issue a fresh link from your library at
          any time.
        </p>
        <p>
          Some products are delivered through the platform itself. Wix Studio templates
          arrive through Wix’s own site-transfer link, which asks you to sign in to Wix and
          accept Wix’s terms. Go High Level snapshots are loaded into the sub-account you
          connect at checkout.
        </p>
      </Section>

      <Section title="6. Cancellation and your right of withdrawal">
        <p>
          Because products are digital and delivered immediately, at checkout you ask us to
          begin delivery straight away and acknowledge that, once it begins, you lose any
          statutory right to cancel that would otherwise apply (for example the 14-day
          withdrawal right for consumers in the EU and UK). This does not affect your right
          to a product that works as described: see the{" "}
          <Link href="/legal/refunds" className="text-accent hover:underline">Refund policy</Link>.
          We keep a record of the terms version you accepted and when.
        </p>
      </Section>

      <Section title="7. Refunds and chargebacks">
        <p>
          Refunds for technical defects are available for {REFUND_WINDOW_DAYS} days under
          the Refund policy. Please open a refund ticket before contacting your bank. If a
          chargeback is filed for a product that was delivered and works as described, we
          may suspend the license and your access to the product while the dispute is
          resolved, and we will share delivery records with the card network.
        </p>
      </Section>

      <Section title="8. Reviews">
        <p>
          Only verified buyers can review a product. Reviews must reflect your own honest
          experience. We do not buy, write, suppress or selectively publish reviews, and we
          do not display ratings that do not come from real purchases. We may remove reviews
          that are fake, abusive, off-topic, contain personal data or are written in
          exchange for compensation. By posting a review you let us display it on{" "}
          {LEGAL.brand} and in our marketing, with your display name.
        </p>
      </Section>

      <Section title="9. AI-assisted products and features">
        <p>
          Some products are designed or written with the help of AI tools. Every product is
          checked by a person before it is listed. Where we offer AI features or AI-agent
          products (for example chat or voice agent setups), their outputs can be wrong or
          incomplete; you are responsible for reviewing them before you rely on or publish
          them, and for using them lawfully as set out in the{" "}
          <Link href="/legal/acceptable-use" className="text-accent hover:underline">Acceptable use &amp; AI policy</Link>.
        </p>
      </Section>

      <Section title="10. Our intellectual property">
        <p>
          The {LEGAL.brand} site, brand, software and first-party products belong to Gambix.
          Third-party products belong to their sellers. Except for the license you buy,
          nothing here grants you any right to them.
        </p>
      </Section>

      <Section title="11. Disclaimers">
        <p>
          We work to ensure every product functions as described on the platform listed at
          the time of purchase. Beyond that, and to the extent the law allows, the site and
          products are provided “as is”. We do not promise any business result such as
          leads, search rankings, conversions or revenue, and we are not responsible for
          changes a platform makes after your purchase.
        </p>
      </Section>

      <Section title="12. Limitation of liability">
        <p>
          To the extent the law allows, Gambix is not liable for indirect, incidental,
          special, consequential or punitive damages, or for lost profits, revenue, data or
          goodwill. Our total liability for any claim relating to a product or the site is
          limited to the amount you paid us for that product in the 12 months before the
          claim. Nothing in these terms limits liability that cannot be limited by law,
          including for fraud or for death or personal injury caused by negligence.
        </p>
      </Section>

      <Section title="13. Indemnity">
        <p>
          If you use products for a business, you agree to cover Gambix’s reasonable losses
          and costs arising from your breach of these terms or the license, or from content
          you publish with a product.
        </p>
      </Section>

      <Section title="14. Suspension and termination">
        <p>
          You can close your account at any time. We may suspend or close accounts that
          break these terms, commit fraud or abuse refunds. Licenses you paid for and did
          not breach survive account closure; ask us for a copy of your license keys before
          you close.
        </p>
      </Section>

      <Section title="15. Changes to these terms">
        <p>
          We may update these terms. Changes apply to purchases made after the new version
          is published; the version you accepted at checkout continues to govern that
          purchase. We will flag material changes on this page and, where appropriate, by
          email.
        </p>
      </Section>

      <Section title="16. Governing law and disputes">
        <p>
          These terms are governed by the laws of {governingLaw()}, United States, without
          regard to conflict-of-law rules. Before starting any claim, contact us and give us
          30 days to try to resolve it informally. Disputes that are not resolved go to the
          state or federal courts located in that state, and either party may use small
          claims court where eligible. If you are a consumer living outside the United
          States, you keep the protection of the mandatory laws of your home country and may
          bring a claim there.
        </p>
      </Section>

      <Section title="17. General">
        <p>
          These terms are the whole agreement between you and Gambix about their subject.
          If a court finds part of them unenforceable, the rest still applies. Not enforcing
          a right is not a waiver of it. We may transfer these terms as part of a sale or
          reorganization of the business; you may not transfer them without our consent.
        </p>
      </Section>
    </LegalDoc>
  );
}
