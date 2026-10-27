import LegalDoc, { List, Section } from "@/components/LegalDoc";
import { LEGAL, contactLine } from "@/lib/legal";

export const metadata = { title: "Acceptable use & AI policy — DesignPulse" };

export default function AcceptableUsePage() {
  return (
    <LegalDoc
      path="/legal/acceptable-use"
      title="Acceptable use & AI policy"
      summary="Use the marketplace honestly, replace every placeholder before you publish, and if you run AI chat or voice agents from our snapshots, get consent and tell people they are talking to an AI."
    >
      <Section title="1. Using the marketplace">
        <p>You must not:</p>
        <List
          items={[
            "Share, resell or publish license keys, download links or Wix transfer links.",
            "Scrape, crawl or bulk-download the site, its listings or previews, including to feed an AI system.",
            "Probe, bypass or attack our security, delivery or license checks, or upload malware.",
            "Write fake reviews, review a product you did not buy, offer or accept anything in exchange for a review, or coordinate reviews with others.",
            "Abuse refunds or chargebacks, or buy with someone else’s payment details.",
            "Harass our team, sellers or other users.",
          ]}
        />
      </Section>

      <Section title="2. Publishing what you build">
        <List
          items={[
            "Replace or remove every placeholder before going live. Demo testimonials, reviews, star ratings, customer counts, years in business, license and insurance numbers and before-and-after claims are fictional; publishing them as real is deceptive and, in the US, breaks the FTC’s rule on fake reviews and testimonials.",
            "Only claim certifications, licenses and insurance your business actually holds.",
            "Add your own privacy policy, cookie notice and terms where the law requires them.",
            "Our templates are built to readable contrast and sensible heading structure, but you are responsible for keeping your finished site accessible.",
          ]}
        />
      </Section>

      <Section title="3. AI chat and voice agents, SMS and calls">
        <p>
          Some Go High Level snapshots include AI chat agents, AI voice agents, missed-call
          text-back and automated follow-up. If you switch them on, you are the sender and
          you must:
        </p>
        <List
          items={[
            "Get the consent the law requires before calling or texting anyone. Under the US Telephone Consumer Protection Act, AI-generated voices count as artificial voices, so automated AI calls need prior express consent.",
            "Register your business and campaigns for A2P 10DLC (or the local equivalent) before sending business texts, and honor STOP and opt-out requests immediately.",
            "Tell people when they are talking to an AI agent where the law requires it, and never present an AI agent as a human when asked.",
            "Follow call-recording consent rules, which in several US states require every party’s consent.",
            "Keep marketing emails compliant with CAN-SPAM and similar laws, with a working unsubscribe link.",
            "Review the agent’s prompts and knowledge base for your business before going live. Do not let it give legal, medical, insurance-coverage or financial advice, quote prices you have not approved, or promise arrival times you cannot keep.",
          ]}
        />
      </Section>

      <Section title="4. Using AI with our products">
        <p>
          You may use AI tools to customize your own end product. You may not use our
          products, previews or listings to train, fine-tune or evaluate AI models, to build
          datasets, or to generate templates, themes or snapshots that compete with them.
          You are responsible for checking anything an AI tool writes for you before you
          publish it.
        </p>
      </Section>

      <Section title="5. Reporting and enforcement">
        <p>
          Report misuse, suspected infringement or a security issue to {contactLine()}. For
          copyright complaints, include the work, where it appears on {LEGAL.brand}, your
          contact details and a statement that you believe in good faith the use is not
          authorized; we respond to valid notices under the US Digital Millennium Copyright
          Act. We may remove content, revoke licenses or close accounts that break this
          policy.
        </p>
      </Section>
    </LegalDoc>
  );
}
