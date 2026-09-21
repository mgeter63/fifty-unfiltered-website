import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts, SITE } from '../lib/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: `/blog/${post.data.slug}`,
      categories: [post.data.category],
      author: `${SITE.email} (${SITE.author})`,
    })),
    customData: `<language>en-us</language><atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />`,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
  });
};
