#!/usr/bin/env node
/**
 * Creates a new post file with today's date and the right frontmatter.
 *   npm run new-post -- "Where I've Been and Why I'm Not Apologizing" "Grown Folks Business"
 */
import fs from 'node:fs';
import path from 'node:path';

const [title, category = 'Grown Folks Business'] = process.argv.slice(2);
if (!title) {
  console.error('Usage: npm run new-post -- "Post title" "Category"');
  process.exit(1);
}
const slug = title
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const date = new Date().toISOString().slice(0, 10);
const file = path.join('content', 'posts', `${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}
const q = (s) => JSON.stringify(s);
fs.writeFileSync(
  file,
  `---
title: ${q(title)}
slug: ${q(slug)}
date: ${date}
category: ${q(category)}
excerpt: "One or two sentences that show on the blog list."
metaDescription: "Up to about 155 characters for Google and social previews."
readTime: "6 min read"
coverImage: "/images/${slug}.jpg"
coverAlt: "Describe the cover image."
---

Start writing here.
`,
);
console.log(`Created ${file}`);
console.log(`Post will be live at /blog/${slug}`);
