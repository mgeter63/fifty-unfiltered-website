# Fifty and Unfiltered — fiftyandunfiltered.com

Blog and community site for Black women over 50, written by Mary Geter.
Built with [Astro](https://astro.build), hosted on Vercel, newsletter signups stored in Resend.

## Publish a new post

1. Copy `content/POST-TEMPLATE.md` to `content/posts/<your-slug>.md`
   (or on GitHub: **Add file → Create new file**, name it `content/posts/<your-slug>.md`).
2. Fill in the frontmatter at the top (title, slug, date, category, excerpt, metaDescription, readTime, coverImage).
   The `slug` must match the file name and is the web address: `/blog/<your-slug>`.
3. Write the post below the `---` line in plain text. Blank line = new paragraph. `## Heading` = section heading.
4. Put the cover image in `public/images/` (1200×675 or similar, under 300 KB).
5. Commit to `main`. Vercel rebuilds the site in about a minute. The post appears on `/blog`, on the home page, in `/rss.xml`, and in `/sitemap.xml` automatically.

A post with `draft: true` in its frontmatter is hidden from the live site.

Locally you can run `npm run new-post -- "Post Title" "Category"` to create the file with today's date.

## Hero video, reel wall, quote slider

- **Hero video:** upload `hero.mp4` (muted, 10 to 20 seconds, 1920x1080, under 8 MB) to `public/video/`. It plays automatically behind the headline; the photo stays as the fallback and for visitors with reduced motion turned on. Optional `hero.webm` alongside it.
- **Hero photo:** upload a landscape `hero.jpg` to `public/images/` to replace the current one.
- **Reel wall:** upload the MP4 and a poster JPG to `public/reels/`, then add a block to `content/reels.json`.
- **Quote slider:** edit the lines in `content/quotes.json`.

Full step-by-step in `content/REELS-AND-QUOTES.md`.

## Design

Rich Black `#1A1A1A` base, Bold Fuchsia `#CC0066` and Gold `#D4AF37` accents only. Oswald (headlines, uppercase) and Lato (body), self-hosted in `public/fonts/` under the SIL Open Font License. Scroll animations and the background video respect the visitor's reduced-motion setting.

## Categories

Filter buttons on `/blog` come from `CATEGORIES` in `src/lib/posts.ts`. Any new category used in a post's frontmatter is added to the filters automatically.

## Site map

| Path | What it is |
|---|---|
| `/` | Home |
| `/blog` | Blog index (all posts, newest first, category filters) |
| `/blog/<slug>` | One post |
| `/about`, `/contact` | About Mary, contact form |
| `/privacy`, `/disclaimer` | Legal pages linked from the footer |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | Generated from the posts folder |
| `/api/subscribe` | Newsletter signup → Resend Audience |
| `/api/contact` | Contact form → email to Mary through Resend |

Old Squarespace addresses (`/podcast/...`, `/home`, and others) are permanently redirected; see `redirects` in `astro.config.mjs`.

## Environment variables (Vercel → Settings → Environment Variables)

See `.env.example`. Required: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` (or `RESEND_SEGMENT_ID`), `CONTACT_FROM_EMAIL`.
Never put these in the code.

## Local development

```
npm install
npm run dev      # http://localhost:4321
npm run build    # production build (also validates every post's frontmatter)
```
