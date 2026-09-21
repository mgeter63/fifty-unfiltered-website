import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Filter buttons on /blog, in display order. New categories in frontmatter are added automatically. */
export const CATEGORIES = [
  'Relationships',
  'Mental Health',
  'Health & Body',
  'Money',
  'Identity',
  'Family',
  'The Body Still Works',
  'Body and Appearance',
  'Grown Folks Business',
  'Friendship',
  "I Don't Do That Anymore",
  'The Ones Behind Us',
  'New World Problems',
];

export const SITE = {
  name: 'Fifty and Unfiltered',
  url: 'https://www.fiftyandunfiltered.com',
  author: 'Mary Geter',
  email: 'mgeter@fiftyandunfiltered.com',
  description:
    'Fifty and Unfiltered is a blog and community for Black women over 50 navigating love, health, money, identity, and everything in between. No sugarcoating. Just real talk.',
  defaultImage: '/images/img06.jpg',
};

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** All published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft || import.meta.env.DEV);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function postUrl(post: Post): string {
  return `/blog/${post.data.slug}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** Categories to show as filters: the fixed list plus anything new found in the posts. */
export function allCategories(posts: Post[]): string[] {
  const extra = posts.map((p) => p.data.category).filter((c) => !CATEGORIES.includes(c));
  return [...CATEGORIES, ...Array.from(new Set(extra))];
}
