import { useEffect, useState } from "react";
import { defaultPosts, type BlogPost } from "../data/blog";
import { supabase, supabaseConfigured } from "../lib/supabase";

/** Posts already loaded in this visit, so going from the Blog page into a post does not wait again. */
let cache: BlogPost[] | null = null;

/**
 * Published posts from the admin panel (table blog_posts), newest first. `posts` is null while loading.
 * Falls back to the post in src/data/blog.ts only when the database cannot be reached.
 */
export function useBlogPosts(): BlogPost[] | null {
  const [posts, setPosts] = useState<BlogPost[] | null>(cache ?? (supabaseConfigured && supabase ? null : defaultPosts));
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    let alive = true;
    supabase.from("blog_posts").select("id, slug, title, category, author, excerpt, body, cover_url, photo_url, photo_caption, published_on")
      .eq("published", true).order("published_on", { ascending: false }).order("id", { ascending: false })
      .then(({ data, error }) => {
        const next = error || !data ? cache ?? defaultPosts : data;
        if (!error && data) cache = data;
        if (alive) setPosts(next);
      });
    return () => { alive = false; };
  }, []);
  return posts;
}
