import LegalDoc, { List, Section } from "@/components/LegalDoc";
import { LEGAL, contactLine } from "@/lib/legal";

export const metadata = { title: "Privacy policy — DesignPulse" };

const PROCESSORS: [string, string][] = [
  ["Supabase", "database, sign-in and file storage (United States)"],
  ["Vercel", "website hosting and server logs (United States and edge locations)"],
  ["Stripe", "payment processing, receipts and fraud prevention"],
  ["Wix", "only when you redeem a Wix template; the transfer happens on Wix under Wix’s privacy policy"],
  ["HighLevel", "only when you connect a Go High Level sub-account to receive a snapshot"],
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      path="/legal/privacy"
      title="Privacy policy"
      summary="We collect what we need to run your account, take payment and deliver what you buy. We do not sell or share your data for advertising, we do not use advertising cookies, and we do not use your data or files to train AI models."
    >
      <Section title="1. Who is responsible">
        <p>
          {LEGAL.entity} operates {LEGAL.brand} and is the controller of the personal data
          described here. Contact us at {contactLine()} for any privacy question or request.
        </p>
      </Section>

      <Section title="2. What we collect">
        <List
          items={[
            "Account details: name, email address, password (stored only as a hash by our sign-in provider) and your role on the site.",
            "Purchases: what you bought, the price, license keys and delivery records such as when a download link was issued and used. From Stripe we receive payment status and limited card details (brand, last four digits, country); we never receive your full card number.",
            "Support and refunds: what you write in tickets and any screenshots or recordings you upload as proof.",
            "Reviews, wishlist items and, if you apply to sell, your seller profile, portfolio link and application answers.",
            "Integrations: if you connect Go High Level, the sub-account name and ID you authorize.",
            "Early-access lists: the email, role, trade and interest you give when you join a waitlist, used only to tell you when that product opens.",
            "Technical data: IP address, browser type and request logs kept by our hosting provider, plus the essential cookies that keep you signed in. Your light or dark theme choice is stored only in your own browser.",
          ]}
        />
      </Section>

      <Section title="3. How we use it">
        <List
          items={[
            "To create and secure your account and deliver what you buy (performing our contract with you).",
            "To take payment, prevent fraud and handle refunds and chargebacks (contract and legitimate interests).",
            "To keep tax, accounting and transaction records (legal obligation).",
            "To review products, moderate reviews and improve the marketplace (legitimate interests).",
            "To send service emails about your account and purchases. We send marketing emails only if you opt in, and every one has an unsubscribe link.",
          ]}
        />
      </Section>

      <Section title="4. AI and your data">
        <p>
          We do not use your personal data, purchase history, support tickets or uploaded
          files to train AI or machine-learning models. The one exception sits with Stripe,
          which uses payment data under its own privacy policy to run its fraud-prevention
          models. If we offer AI features, what you enter is processed only to produce your
          result, by providers bound by no-training terms, and we will say so where the
          feature appears.
        </p>
      </Section>

      <Section title="5. Who we share it with">
        <p>We use these service providers, each bound to process data only on our instructions:</p>
        <List items={PROCESSORS.map(([name, purpose]) => <><span className="text-ink">{name}</span>: {purpose}</>)} />
        <p>
          If you buy a third-party seller’s product, the seller sees your display name and
          the order details needed to support you, never your payment details. We also
          disclose data when the law requires it, to protect our rights or users, or to a
          buyer of the business under equivalent protections.
        </p>
        <p>
          We do not sell personal information and do not share it for cross-context
          behavioral advertising. We honor Global Privacy Control signals; as we neither sell
          nor share data, there is nothing further to opt out of.
        </p>
      </Section>

      <Section title="6. International transfers">
        <p>
          We are based in the United States and our providers store data there. Where data
          from the EU, UK or Switzerland is transferred, we rely on the EU-US Data Privacy
          Framework where a provider is certified, or on Standard Contractual Clauses.
        </p>
      </Section>

      <Section title="7. How long we keep it">
        <List
          items={[
            "Account data: while your account is open, then deleted within 30 days of closure, except as below.",
            "Order, payment and license records: seven years, for tax and to keep your licenses verifiable.",
            "Refund tickets and proof files: three years after the ticket closes.",
            "Reviews: kept after account closure with your name removed, unless you ask us to delete them.",
          ]}
        />
      </Section>

      <Section title="8. Your rights">
        <p>
          Wherever you live, you can ask us to access, correct, delete or export your data,
          and to restrict or object to how we use it. Residents of the EU, UK and US states
          with privacy laws (including California, Colorado, Connecticut, Virginia, Texas and
          Oregon) have these rights by law, along with the right to appeal our decision and
          to complain to their data protection authority or state attorney general. We will
          not treat you differently for using them.
        </p>
        <p>
          Send requests to {contactLine()}. We verify requests by confirming control of the
          account email and reply within 30 days (45 days where US state law allows).
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          {LEGAL.brand} is for businesses and adults. It is not directed to children, and we
          do not knowingly collect data from anyone under 16.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          Data is encrypted in transit, database access is enforced by row-level security,
          and payment data stays with Stripe. No system is perfectly secure; if a breach
          affects your data we will notify you and the authorities as the law requires.
        </p>
      </Section>

      <Section title="11. Changes">
        <p>
          We will post any update here with a new effective date, and email you about
          material changes.
        </p>
      </Section>
    </LegalDoc>
  );
}
