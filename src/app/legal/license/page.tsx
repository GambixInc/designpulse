import Link from "next/link";
import LegalDoc, { List, Section } from "@/components/LegalDoc";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "License agreement — DesignPulse" };

export default function LicensePage() {
  return (
    <LegalDoc
      path="/legal/license"
      title="License agreement"
      summary="Standard covers one end product for you or one client. Extended covers unlimited end products, including client work. Neither lets you resell or share the product itself, and neither lets you use it to train AI or build a competing template."
    >
      <Section title="1. Definitions">
        <List
          items={[
            <><span className="text-ink">Item</span>: the product you bought, including its design, layout, code, copy, workflows and bundled assets.</>,
            <><span className="text-ink">End product</span>: one website, store, funnel or Go High Level sub-account built with the Item for a single business or person.</>,
            <><span className="text-ink">Client</span>: a person or business you build an end product for, paid or unpaid.</>,
          ]}
        />
      </Section>

      <Section title="2. Standard license">
        <List
          items={[
            "Use the Item to build one end product, for yourself or for one client.",
            "Wix Studio: one site transfer. Go High Level: one sub-account (location). Other platforms: one domain, plus staging and development copies of it.",
            "Modify it however you like and keep using it for as long as the end product exists.",
          ]}
        />
      </Section>

      <Section title="3. Extended license">
        <List
          items={[
            "Use the Item to build unlimited end products, for yourself and for any number of clients.",
            "Charge clients for the end products you build, and hand those end products over to them.",
            "Go High Level: load the snapshot into unlimited sub-accounts inside your own agency account, including client locations.",
          ]}
        />
      </Section>

      <Section title="4. What both licenses include">
        <List
          items={[
            "Updates to the version you bought, when we release them.",
            "A unique license key per purchase, shown in your library.",
            "Using AI tools to edit or customize your own end product.",
          ]}
        />
      </Section>

      <Section title="5. What no license allows">
        <List
          items={[
            "Reselling, sharing, sublicensing or giving away the Item itself, modified or not, including as a template, theme, kit, snapshot or share link on any marketplace (Wix, ThemeForest, the HighLevel marketplace or similar).",
            "Making the Item available inside a site builder, template generator or design library that lets others create their own sites from it.",
            "Using the Item, or any part of its design, code, copy or images, to train, fine-tune, evaluate or benchmark an AI or machine-learning model, to build a dataset, or to generate products that compete with it.",
            "Removing license notices, or claiming the Item’s design as your own original work in a way that suggests you created it.",
            "Registering the Item’s design, names or demo brands as a trademark.",
          ]}
        />
      </Section>

      <Section title="6. Demo content">
        <p>
          Demo photographs come from free-license libraries such as Pexels and Pixabay and
          are included under those libraries’ licenses; demo fonts are Google Fonts under
          the SIL Open Font License. Demo business names, phone numbers, addresses,
          testimonials, ratings, license and permit numbers and statistics are fictional
          placeholders. Replace them with your own accurate information, or remove them,
          before you publish. You are responsible for the content of your end product.
        </p>
      </Section>

      <Section title="7. Ownership and ending the license">
        <p>
          {LEGAL.entity} or the seller keeps all rights in the Item. Your license is
          perpetual, but it ends automatically if you breach this agreement or receive a
          refund for the purchase. When it ends you must stop using the Item and delete it,
          including any Wix site created from the transfer link and any snapshot loaded into
          a sub-account, unless an end product has already been handed to a client under an
          Extended license you paid for and did not breach.
        </p>
      </Section>

      <Section title="8. Choosing a tier">
        <p>
          A side-by-side comparison is on the{" "}
          <Link href="/licenses" className="text-accent hover:underline">Licenses &amp; pricing</Link>{" "}
          page. If you bought Standard and need Extended, contact us: we will credit what you
          paid toward the upgrade.
        </p>
      </Section>
    </LegalDoc>
  );
}
