/**
 * Blog posts. The live list is managed in the admin panel (Blog) and read from the database; the post below is what the
 * page shows when the database cannot be reached, and matches what the database starts with
 * (supabase/migrations/20250121000000_blog_posts.sql). Its photos: public/assets/images/gallery/education/.
 */
export interface BlogPost {
  id?: number; slug: string; title: string; category: string; author: string; excerpt: string; body: string;
  cover_url?: string | null; photo_url?: string | null; photo_caption?: string; published_on: string;
}

/** The groups offered in the admin form (another one can be typed in). */
export const blogCategories = ["Education", "Health", "Women Empowerment", "Environment", "Social Relief", "Volunteers", "Stories"];

export const defaultPosts: BlogPost[] = [
  {
    slug: "a-mat-a-slate-and-a-second-chance",
    title: "A Mat, a Slate and a Second Chance: An Evening at a Sahara Learning Centre",
    category: "Education", author: "Sahara Team", published_on: "2026-10-06",
    excerpt: "When the school day ends, the learning starts again on a plastic mat in a brick-walled room. A look inside the free evening centres that help children in Sagar keep up, and stay in school.",
    cover_url: "/assets/images/gallery/education/children-studying-centre.jpg",
    photo_url: "/assets/images/gallery/education/children-learning-kits.jpg",
    photo_caption: "Slates, picture books and school bags: children at one of our learning sessions.",
    body: [
      "The school day is over, but on a plastic mat spread across a brick-walled room the learning is only beginning. A dozen children sit shoulder to shoulder with notebooks open on their knees, while a young teacher from their own neighbourhood moves from one child to the next.",
      "## Why an evening class matters",
      "In the rural clusters and slum settlements of Sagar district, many children are the first in their family to go to school. When a lesson is missed, there is often nobody at home who can explain it. A small gap in reading or arithmetic quietly grows, until one day the child stops going at all. Our Shiksha Kendras were set up to close that gap early.",
      "> A place to sit, a slate to write on and someone who notices: a child does not need much more than that to begin.",
      "## What happens on the mat",
      "The centres are free. Children get remedial help with reading, writing and numbers, and the youngest start with slates and picture books before they move on to notebooks. School kits and uniforms are part of the support, so that no child stays at home because the family cannot afford a bag or a pencil.",
      "## Small things that keep a child in school",
      "None of this is complicated. A regular hour, a familiar teacher and a school bag of their own tell a child that their learning matters to somebody. Learning support is strongest when families and the community become part of the journey, which is why the centres sit inside the neighbourhoods they serve.",
      "## How you can help",
      "You can sponsor a child's education or fund a school kit from our Donate page. If you have time rather than funds, the Get Involved page shows how to volunteer with us."
    ].join("\n\n")
  }
];

export type BlogBlock = { kind: "p" | "h" | "quote"; text: string };
/** The post text as blocks: an empty line starts a new one; "## " makes a heading and "> " a highlighted quote. */
export function blogBlocks(body: string): BlogBlock[] {
  return body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).map((s): BlogBlock =>
    s.startsWith("## ") ? { kind: "h", text: s.slice(3).trim() } : s.startsWith("> ") ? { kind: "quote", text: s.slice(2).trim() } : { kind: "p", text: s });
}
/** Reading time in minutes, at about 200 words a minute. */
export const readMinutes = (body: string) => Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
/** Only a file of this website or an https link is ever shown. */
export const safeUrl = (u?: string | null) => (u && /^(\/(?!\/)|https:\/\/)/.test(u) ? u : null);
export const blogDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
