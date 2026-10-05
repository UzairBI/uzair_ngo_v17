import { Link } from "react-router-dom";
import { site } from "../data/site";
import { useTitle } from "../hooks/useTitle";
import PageHero from "../components/PageHero";

type Section = { h: string; p: string[] };
const contact = `${site.name}, ${site.address}. Email: ${site.email}. Phone: ${site.phone}.`;

const docs: Record<"privacy" | "terms" | "dpdp", { title: string; intro: string; sections: Section[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: `${site.name} respects your privacy. This policy explains what personal information this website collects, why, and the choices you have.`,
    sections: [
      { h: "Information we collect", p: ["Details you give us through our forms: name, email address, phone number, organisation, postal address (only for hard-copy requests) and the message you write.", "Donation details needed to issue receipts, such as name, email, phone and PAN (for 80G receipts). Card, UPI and bank details are handled by the payment gateway and are not stored by us."] },
      { h: "How we use it", p: ["To reply to your enquiry, process document requests, register volunteers and event attendees, issue donation receipts, and send newsletters you subscribed to.", "We do not sell or rent your personal information."] },
      { h: "Sharing", p: ["We share data only with service providers who help us run the website, send email or process payments, and with authorities when the law requires it."] },
      { h: "Retention and security", p: ["We keep your information only as long as needed for the purpose it was given, or as required by tax and accounting law. We use reasonable technical and organisational measures to protect it."] },
      { h: "Your choices", p: ["You may ask us to access, correct or delete your information, or unsubscribe from the newsletter at any time. See the DPDP Compliance Notice for your rights under Indian law."] },
      { h: "Contact", p: [contact] }
    ]
  },
  terms: {
    title: "Terms of Use",
    intro: `By using this website you agree to these terms. If you do not agree, please do not use the site.`,
    sections: [
      { h: "Use of the website", p: ["The content is provided for general information about the work of " + site.name + ". You may not misuse the site, attempt unauthorised access, or submit false or harmful information through its forms."] },
      { h: "Content and copyright", p: ["Text, photographs and logos belong to " + site.name + " or their respective owners. You may share them for non-commercial, awareness purposes with credit to us. Any other use needs our written permission."] },
      { h: "Donations", p: ["Donations are voluntary. Receipts and tax certificates are issued as per applicable law. Refund requests must be sent to us in writing."] },
      { h: "External links", p: ["We are not responsible for the content or privacy practices of other websites we link to."] },
      { h: "Disclaimer", p: ["We try to keep information accurate and current but give no warranty that the site is error-free or always available."] },
      { h: "Contact", p: [contact] }
    ]
  },
  dpdp: {
    title: "DPDP Compliance Notice",
    intro: `This notice explains how ${site.name} handles your personal data under India's Digital Personal Data Protection Act, 2023 (DPDP Act).`,
    sections: [
      { h: "Consent and purpose", p: ["We process your personal data only with your consent, given when you submit a form, and only for the purpose stated on that form. You may withdraw consent at any time by writing to us."] },
      { h: "Your rights as a Data Principal", p: ["You have the right to access a summary of your data, ask for correction or erasure, nominate another person to exercise your rights if you are unable to, and have your grievances addressed."] },
      { h: "Children's data", p: ["We do not knowingly collect personal data of children without verifiable consent of a parent or guardian."] },
      { h: "Grievance officer", p: [`Send requests or complaints to ${site.email} with the subject "Data Privacy". We will respond within a reasonable time. If you remain unsatisfied you may approach the Data Protection Board of India.`] },
      { h: "Contact", p: [contact] }
    ]
  }
};

export default function Legal({ kind }: { kind: keyof typeof docs }) {
  const { title, intro, sections } = docs[kind];
  useTitle(title);
  return (<><PageHero eyebrow="Legal" title={title} />
    <section className="container-site max-w-3xl py-16 text-ink/80">
      <p>{intro}</p>
      {sections.map((s) => (
        <div key={s.h} className="mt-8">
          <h2 className="font-serif text-xl font-bold text-ink">{s.h}</h2>
          {s.p.map((x) => <p key={x} className="mt-2">{x}</p>)}
        </div>
      ))}
      <p className="mt-10 text-sm text-ink/60">Last updated: October 2026.</p>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {kind !== "privacy" && <Link to="/privacy" className="text-brand underline">Privacy Policy</Link>}
        {kind !== "terms" && <Link to="/terms" className="text-brand underline">Terms of Use</Link>}
        {kind !== "dpdp" && <Link to="/dpdp" className="text-brand underline">DPDP Compliance Notice</Link>}
      </p>
    </section></>);
}
