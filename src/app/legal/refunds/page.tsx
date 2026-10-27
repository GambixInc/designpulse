import LegalDoc, { List, Section } from "@/components/LegalDoc";
import { REFUND_REASONS, REFUND_WINDOW_DAYS } from "@/lib/format";

export const metadata = { title: "Refund policy — DesignPulse" };

export default function RefundsPage() {
  const defects = REFUND_REASONS.filter((r) => r.defect).map((r) => r.label);
  return (
    <LegalDoc
      path="/legal/refunds"
      title="Refund policy"
      summary={`If a product is broken, incomplete or not as described, tell us within ${REFUND_WINDOW_DAYS} days and we will fix it or refund it. Because delivery is instant and cannot be taken back, we do not refund change-of-mind purchases.`}
    >
      <Section title="1. What is covered">
        <p>
          You can ask for a refund within {REFUND_WINDOW_DAYS} days of purchase when the
          product has a verifiable technical defect:
        </p>
        <List items={defects} />
      </Section>

      <Section title="2. What is not covered">
        <List
          items={[
            "Changing your mind, or no longer needing the product.",
            "Not having the platform plan, hosting or apps the listing says you need.",
            "Difficulty customizing the product, or wanting features it does not claim to have.",
            "Conflicts with third-party apps, plugins or custom code the listing does not list as compatible.",
            "Changes a platform makes after the refund window closes.",
          ]}
        />
        <p>
          We may still make an exception, for example if you bought the same item twice by
          mistake and have not used either copy.
        </p>
      </Section>

      <Section title="3. How to ask">
        <List
          items={[
            "Open your library, find the purchase and choose “Refund”.",
            "Pick the reason, describe the problem and, where you can, attach a screenshot or screen recording.",
            "Our in-house review team checks every ticket by hand. We aim to reply within five business days, and we will usually try to fix the problem or send a corrected version first.",
          ]}
        />
        <p>
          The {REFUND_WINDOW_DAYS}-day window is counted from your purchase date and is
          enforced automatically.
        </p>
      </Section>

      <Section title="4. When a refund is approved">
        <p>
          We refund the full price of the item to your original payment method through
          Stripe. Most banks show it within 5 to 10 business days. The license for that
          purchase ends: delete the product, including any Wix site created from the
          transfer link or snapshot loaded into a sub-account.
        </p>
      </Section>

      <Section title="5. Your legal rights">
        <p>
          This policy does not limit rights you have under the law where you live, such as
          the right of consumers in the EU, UK and Australia to digital content that matches
          its description and works as it should. Please open a refund ticket before
          contacting your bank; a chargeback on a product that was delivered and works may
          lead to the license being suspended while the dispute is resolved.
        </p>
      </Section>
    </LegalDoc>
  );
}
