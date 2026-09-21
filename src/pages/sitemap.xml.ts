import type { APIRoute } from 'astro';
import { getPosts, SITE } from '../lib/posts';

const STATIC_PAGES = ['/', '/blog', '/about', '/contact', '/privacy', '/disclaimer'];

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const newest = posts[0]?.data.date ?? new Date();
  const day = (d: Date) => d.toISOString().slice(0, 10);

  const urls = [
    ...STATIC_PAGES.map((p) => ({
      loc: new URL(p, SITE.url).toString(),
      lastmod: day(p === '/' || p === '/blog' ? newest : new Date()),
      priority: p === '/' ? '1.0' : p === '/blog' ? '0.9' : '0.5',
    })),
    ...posts.map((post) => ({
      loc: `${SITE.url}/blog/${post.data.slug}`,
      lastmod: day(post.data.date),
      priority: '0.8',
    })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${escape(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
