import { projects, values, mission, thematicAreas, ways, stats, statText } from "./content";
import { portfolio } from "./portfolio";
import { focusAreas } from "./projectFocus";
import { site } from "./site";
import { legalDocs, type LegalKind } from "./legal";

/**
 * Every piece of page text an admin can change (admin panel -> Website Pages). `text` is the original wording,
 * shown until an admin saves a different one (table page_content, one row per changed key).
 * The website reads these with usePageText() from src/hooks/usePageText.ts; the admin panel builds its form from this list.
 * To make another text editable: add an entry here and show it with c("its.key") on the page.
 */
export interface PageText { key: string; page: string; label: string; text: string; /** small heading shown in the admin form above the first text of a group */ section?: string; /** a paragraph (tall box in the admin form) rather than a one-line heading */ long?: boolean }

const list: PageText[] = [];
const add = (page: string, rows: [key: string, label: string, text: string, long?: boolean][]) =>
  rows.forEach(([key, label, text, long]) => list.push({ key, page, label, text, long: long ?? text.length > 90 }));

/** The four figures of the white card under the founder's message (Home page and Impact Report). Shown until an admin types another number. */
export const keyFigureDefaults = (): [label: string, value: string][] => [
  ["Years of Service", `${Math.floor((new Date().getFullYear() - 2004) / 5) * 5}+`], // registered 19 October 2004 (site.regDate)
  ["Children Supported", `${(stats.find((x) => /children/i.test(x.label))?.value ?? 0).toLocaleString("en-IN")}+`],
  ["Projects Delivered", String(portfolio.length)],
  ["Core Programmes", String(projects.length)]
];

// Numbers: typed as they should appear, e.g. 25,000+ or 2,000+ patients. They count up on the website.
// A "...value" key followed by its "...label" key is one line in the admin form: the number and its text side by side.
add("Home: Impact Numbers", [
  ...stats.flatMap((s, i): [string, string, string, boolean][] => [
    [`home.impact.${i + 1}.value`, `Impact dashboard ${i + 1}: number`, statText(s), false],
    [`home.impact.${i + 1}.label`, `Impact dashboard ${i + 1}: text`, s.label, false]]),
  ...keyFigureDefaults().flatMap(([label, value], i): [string, string, string, boolean][] => [
    [`home.figures.${i + 1}.value`, `Key figure ${i + 1}: number`, value, false],
    [`home.figures.${i + 1}.label`, `Key figure ${i + 1}: text`, label, false]])
]);
list.forEach((x) => { if (x.key.startsWith("home.impact.")) x.section = "Impact dashboard"; else if (x.key.startsWith("home.figures.")) x.section = "Key figures card"; });

add("About Us", [
  ["about.hero.title", "Banner heading", "Community Progress Built on Integrity & Action."],
  ["about.hero.text", "Banner text", "Working alongside rural and urban families to create practical, inclusive pathways to healthcare, education, livelihoods, and environmental protection."],
  ["about.founder.title", "Founder message: heading", "Message from the Founder Chairman & CEO"],
  ["about.founder.lead", "Founder message: opening words (bold)", "Established in 2004,"],
  ["about.founder.intro", "Founder message: first paragraph", `${site.name} has grown from community-led work into programmes supporting education, healthcare, nutrition, women's livelihoods, renewable energy and environmental awareness across 12 districts of Madhya Pradesh.`],
  ["about.founder.quote1", "Founder message: quote 1", "\"Our journey began with a singular belief: true social welfare is not about charity, but about empowering communities to stand strong on their own feet.\""],
  ["about.founder.quote2", "Founder message: quote 2", "\"Over the years, our dedicated teams of local volunteers, doctors, teachers, and eco-activists have worked tirelessly at the grassroots level. Every step is guided by empathy and accountability.\""],
  ["about.founder.quote3", "Founder message: quote 3", "\"I invite donors, corporate CSR partners, and passionate volunteers to join hands with us as we build healthy, educated, and self-supporting communities.\""],
  ["about.founder.role", "Founder: designation", "Founder Chairman & CEO"],
  ["about.founder.card", "Founder: line on the photo card", "25+ years in social development and community empowerment"],
  ["about.mission.title", "Mission & Vision: heading", "Our Purpose and Foundational Guiding Values"],
  ["about.vision.title", "Vision: heading", "Equitable, Inclusive & Empowered Society"],
  ["about.vision.text", "Vision: text", mission.vision],
  ["about.mission.cardTitle", "Mission: heading", "Sustainable Community Development"],
  ["about.mission.text", "Mission: text", mission.mission],
  ["about.values.title", "Core values: heading", "Our Core Values"],
  ...values.flatMap(([title, text], i): [string, string, string][] => [
    [`about.values.${i + 1}.title`, `Core value ${i + 1}: name`, title],
    [`about.values.${i + 1}.text`, `Core value ${i + 1}: text`, text]]),
  ["about.philosophy.quote", "Philosophy: quote", mission.philosophy],
  ["about.philosophy.text", "Philosophy: text", "Deeply rooted values, volunteers as nurturing agents, and a long-term commitment to growth that benefits future generations."],
  ["about.focus.title", "Thematic areas: heading", "Major Thematic Areas"],
  ...thematicAreas.flatMap(([title, text], i): [string, string, string][] => [
    [`about.focus.${i + 1}.title`, `Thematic area ${i + 1}: name`, title],
    [`about.focus.${i + 1}.text`, `Thematic area ${i + 1}: text`, text]]),
  ["about.reach.title", "Where we work: heading", "12 Districts of Madhya Pradesh and Beyond"],
  ["about.reach.text", "Where we work: text", "With 20+ years of grassroots field experience, the Samiti works with marginalised, tribal, rural and underprivileged communities through participatory, community-driven development."],
  ["about.committee.title", "Executive committee: heading", "Our Executive Committee"],
  ["about.team.title", "Management team: heading", "Management Team"],
  ["about.partners.title", "Partners: heading", "Who We Work With"],
  ["about.partners.text", "Partners: text", "Funding, technology, government and community partners across India and the USA who have made our programmes possible."],
  ["about.legal.title", "Registration: heading", "Registration & Tax Records"],
  ["about.legal.text", "Registration: text", `${site.legalStatus}, registered on ${site.regDate}. 12A and 80G approved, FCRA and CSR-1 registered.`],
  ["about.legal.cta.title", "Registration: blue box heading", "Need Official Legal Documents for CSR Verification?"],
  ["about.legal.cta.text", "Registration: blue box text", "Download our organisation profile with all registration and tax details, read our impact reports, or request copies of individual certificates from the Transparency Center."]
]);

add("Our Projects", [
  ["projects.hero.title", "Banner heading", "Our Projects"],
  ["projects.hero.text", "Banner text", "Comprehensive interventions designed for long-term community resilience."],
  // also shown on the Home page slider and on each project's own page
  ...projects.flatMap((p): [string, string, string][] => [
    [`project.${p.slug}.title`, `${p.category}: project name`, p.title],
    [`project.${p.slug}.text`, `${p.category}: description`, p.text]]),
  ["projects.upcoming.title", "Upcoming projects: heading", "Upcoming & New Projects"],
  ["projects.upcoming.text", "Upcoming projects: text", "Projects we are preparing or have recently started, as announced by our team."],
  ["projects.upcoming.empty", "Upcoming projects: text when there are none", "New projects will be announced here soon."],
  ["projects.portfolio.title", "Portfolio: heading", "Complete Project Portfolio 2004 – 2025"],
  ["projects.portfolio.text", "Portfolio: text (the link to the impact report follows it)", "All 14 projects implemented by the Samiti since 2004, with location, reach, budget and funding source, as reported in our"]
]);

// The funding list itself (hospitals, facilities, amounts) is managed in the admin panel under Medical Funding.
add("Medical Facilities", [
  // the banner heading and description are under Our Projects (Medical Facilities: project name / description)
  ...focusAreas["medical-facilities"].points.flatMap(([title, text], i): [string, string, string][] => [
    [`medical.point.${i + 1}.title`, `About box ${i + 1}: name`, title],
    [`medical.point.${i + 1}.text`, `About box ${i + 1}: text`, text]]),
  ["medical.steps.title", "How it works: heading", "How the medical facilities programme runs"],
  ...focusAreas["medical-facilities"].steps.flatMap(([title, text], i): [string, string, string][] => [
    [`medical.step.${i + 1}.title`, `Step ${i + 1}: name`, title],
    [`medical.step.${i + 1}.text`, `Step ${i + 1}: text`, text]]),
  ["medical.funding.eyebrow", "Funding: small line above the heading", "Where the money went"],
  ["medical.funding.title", "Funding: heading", "Hospitals & Medical Facilities We Have Funded"],
  ["medical.funding.text", "Funding: text", "Every contribution made by the Samiti to a hospital or medical facility, with what it was for and the amount donated."],
  ["medical.hospitals.title", "Hospitals: heading", "Hospital Funding"],
  ["medical.hospitals.empty", "Hospitals: text when there are none", "Hospital contributions will be listed here soon."],
  ["medical.facilities.title", "Medical facilities: heading", "NGO Medical Facilities"],
  ["medical.facilities.empty", "Medical facilities: text when there are none", "Medical facilities will be listed here soon."]
]);

// The organisations themselves are managed in the admin panel under Member Organizations.
add("Memberships", [
  ["memberships.hero.title", "Banner heading", "Our Member Organizations"],
  ["memberships.hero.text", "Banner text", "A strong network of member organizations working at grassroots and institutional levels to create sustainable social impact."],
  ["memberships.list.eyebrow", "Organizations: small line above the heading", "Our network"],
  ["memberships.list.title", "Organizations: heading", "Partners in Lasting Change"],
  ["memberships.list.text", "Organizations: text", "Our partners actively contribute in healthcare, education, women empowerment, child welfare and community development, building an inclusive ecosystem for long-term change."],
  ["memberships.list.empty", "Organizations: text when there are none", "Our member organizations will be listed here soon."],
  ["memberships.apply.eyebrow", "Application form: small line above the heading", "Become a member"],
  ["memberships.apply.title", "Application form: heading", "Apply for Organization Membership"],
  ["memberships.apply.text", "Application form: text", "NGOs, trusts, societies and community organizations can apply to join our network. Fill in the form and our team will review it."],
  ["memberships.apply.step.1.title", "Application step 1: name", "Apply"],
  ["memberships.apply.step.1.text", "Application step 1: text", "Tell us about your organization and who we can contact."],
  ["memberships.apply.step.2.title", "Application step 2: name", "Review"],
  ["memberships.apply.step.2.text", "Application step 2: text", "Our team checks the registration details and may get in touch."],
  ["memberships.apply.step.3.title", "Application step 3: name", "Listed"],
  ["memberships.apply.step.3.text", "Application step 3: text", "Once approved, your organization appears on this page as a member."],
  ["memberships.join.title", "Join box: heading", "Join Our Network"],
  ["memberships.join.text", "Join box: text", "We welcome NGOs, institutions and community organizations to collaborate with us for meaningful and sustainable impact across India."]
]);

add("Photo & Video Gallery", [
  ["media.hero.title", "Banner heading", "Photo & Video Gallery"],
  ["media.hero.text", "Banner text", "Real work. Real people. Real change."],
  ["media.photos.title", "Photos: heading", "Photo Gallery"],
  ["media.videos.title", "Videos: heading", "Video Gallery"],
  ["media.press.title", "Press: heading", "Press / News"]
]);

add("Latest News", [
  ["news.hero.title", "Banner heading", "Latest Stories"],
  ["news.hero.text", "Banner text", "Field stories and programme updates from our team."]
]);

add("Events Calendar", [
  ["events.hero.title", "Banner heading", "Events Calendar"],
  ["events.hero.text", "Banner text", "Health camps, plantation drives, learning centre days and more."],
  ["events.upcoming.title", "Upcoming events: heading", "Upcoming events"],
  ["events.upcoming.empty", "Upcoming events: text when there are none", "No upcoming events yet. Verified drives will be listed here as soon as the dates are confirmed."],
  ["events.past.title", "Past events: heading", "Past events"]
]);

add("Transparency & Reports", [
  ["transparency.hero.title", "Banner heading", "Transparency & Financial Reports"],
  ["transparency.hero.text", "Banner text", "Our impact reports are published openly. Registration certificates are shared on request, for donors, CSR partners, banks and the community."],
  ["transparency.reports.title", "Reports: heading", "Annual & Impact Reports"],
  ["transparency.reports.text", "Reports: text", "The organisation maintains statutory compliance, regular audits and annual reports. Our published impact reports set out what was done, where, for whom and with which partners."],
  ["transparency.annual.title", "Annual reports box: heading", "Comprehensive Annual Report 2004-2025"],
  ["transparency.annual.text", "Annual reports box: text", "The annual report of every financial year since the Samiti was registered in 2004, each one to view online or download."],
  ["transparency.request.title", "Request a certificate: heading", "Request a Certificate"],
  ["transparency.request.text", "Request a certificate: text", `Registered on ${site.regDate} as a society under the M.P. Societies Registration Act, 1973. Fill in the form and your request goes straight to our records team.`],
  ["transparency.step.1.title", "Step 1: name", "Choose"],
  ["transparency.step.1.text", "Step 1: text", "Pick the certificate you need."],
  ["transparency.step.2.title", "Step 2: name", "Tell us who you are"],
  ["transparency.step.2.text", "Step 2: text", "Add your contact details and the purpose, for example donor or CSR due diligence."],
  ["transparency.step.3.title", "Step 3: name", "We reply"],
  ["transparency.step.3.text", "Step 3: text", "Our team checks the records and sends the document to your email, or by post if you ask for a certified copy."],
  ["transparency.request.note", "Request a certificate: closing note (follows the phone and email)", "Availability depends on the records held for the year you ask for."]
]);

add("Get Involved", [
  ["involved.hero.title", "Banner heading", "Volunteer & CSR Partnerships"],
  ["involved.hero.text", "Banner text", "Whether you donate, volunteer, partner via corporate CSR, or sponsor a cause, your involvement reaches lives directly."],
  // the four "ways to help" boxes on the Home page
  ...ways.flatMap((w, i): [string, string, string][] => [
    [`involved.way.${i + 1}.title`, `Way to help ${i + 1}: name`, w.title],
    [`involved.way.${i + 1}.text`, `Way to help ${i + 1}: text`, w.text]]),
  ["involved.volunteer.title", "Volunteer form: heading", "Volunteer with us"],
  ["involved.volunteer.text", "Volunteer form: text", "Tell us how you would like to help and our team will contact you."],
  ["involved.enquiry.title", "CSR form: heading", "Corporate CSR enquiry"],
  ["involved.enquiry.text", "CSR form: text", "Partner with us for verified, reportable impact."]
]);

add("Contact Us", [
  ["contact.hero.title", "Banner heading", "Contact Us & Field Office"],
  ["contact.title", "Heading above the contact boxes", "Field Office & Contact"]
]);

add("Donate", [
  ["donate.title", "Heading", "Make a Donation"],
  ["donate.text", "Text under the heading", "Every donation, no matter how big or small, makes a significant difference to our cause. Thank you for doing your part to help."],
  ["donate.methods.title", "Payment methods: heading", "Choose how to pay on the next page"],
  ["donate.monthly.title", "Monthly donation: name", "Monthly donation"],
  ["donate.monthly.text", "Monthly donation: text", "Give every month and support our work all year."],
  ["donate.note", "Note under the button", "You enter or confirm your amount on the secure payment page that opens next."],
  ["donate.footnote", "Line under the card", "Your gift supports education, health, women's livelihoods, environment and relief work in the communities we serve."],
  ["donate.photo.quote", "Line on the photo", "Every child deserves a chance to learn, grow and dream."]
]);

// The three legal pages: every heading and paragraph of each.
(Object.keys(legalDocs) as LegalKind[]).forEach((kind) => {
  const d = legalDocs[kind];
  add(d.title, [
    [`legal.${kind}.title`, "Page heading", d.title],
    ...(d.intro ? [[`legal.${kind}.intro`, "Opening paragraph", d.intro, true] as [string, string, string, boolean]] : []),
    ...d.sections.flatMap((s, i): [string, string, string, boolean?][] => [
      [`legal.${kind}.s${i + 1}.title`, `Section ${i + 1}: heading`, s.h],
      ...s.p.map((text, j): [string, string, string, boolean] => [`legal.${kind}.s${i + 1}.p${j + 1}`, `Section ${i + 1} (${s.h}): paragraph ${j + 1}`, text, true])]),
    [`legal.${kind}.updated`, "Last updated (month and year; change it whenever you change this page)", d.updated]
  ]);
});

export const pageTexts: readonly PageText[] = list;
export const pageTextDefaults: Readonly<Record<string, string>> = Object.fromEntries(list.map((x) => [x.key, x.text]));
/** Longest text an admin can save for one key (the database enforces the same limit). */
export const PAGE_TEXT_MAX = 2000;
