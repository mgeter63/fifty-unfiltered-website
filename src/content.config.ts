import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Every markdown file in /content/posts becomes a blog post.
 * The frontmatter at the top of each file must match this schema,
 * otherwise the build fails with a message naming the file and field.
 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase words separated by hyphens'),
    date: z.coerce.date(),
    category: z.string().min(1),
    excerpt: z.string().min(1),
    metaDescription: z.string().min(1).max(320),
    readTime: z.string().min(1),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
