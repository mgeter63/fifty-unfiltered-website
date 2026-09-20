// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

/**
 * Permanent (301) redirects for old Squarespace URLs that Google still has indexed.
 * Add more lines here if Search Console reports another dead address.
 * Wildcards (everything under /podcast/, /episodes/, /blog-1/) live in src/pages/<prefix>/[...slug].ts
 * because Astro only allows wildcard redirects to another wildcard route.
 */
const permanent = (destination) => ({ status: 301, destination });

export default defineConfig({
  site: 'https://www.fiftyandunfiltered.com',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  redirects: {
    '/home': permanent('/'),
    '/index.html': permanent('/'),
    '/podcast': permanent('/blog'),
    '/episodes': permanent('/blog'),
    '/blog-1': permanent('/blog'),
    '/blog-2': permanent('/blog'),
    '/posts': permanent('/blog'),
    '/about-1': permanent('/about'),
    '/about-us': permanent('/about'),
    '/about-me': permanent('/about'),
    '/meet-mary': permanent('/about'),
    '/contact-1': permanent('/contact'),
    '/contact-us': permanent('/contact'),
    '/subscribe': permanent('/#join'),
    '/newsletter': permanent('/#join'),
    '/join': permanent('/#join'),
    '/signup': permanent('/#join'),
    '/sponsor': permanent('/about'),
    '/our-sponsor': permanent('/about'),
    '/donate': permanent('/'),
    '/support': permanent('/'),
    '/privacy-policy': permanent('/privacy'),
    '/terms': permanent('/disclaimer'),
  },
});
