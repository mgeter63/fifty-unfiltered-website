import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { EMAIL_RE, readBody, json } from '../../lib/api';
import { getPosts, absoluteUrl } from '../../lib/posts';
import { approvedComments, db, dbUrl, emailHtml, LIMITS, maryEmail, newToken, sendMail } from '../../lib/comments';

export const prerender = false;

const postTitle = async (slug: string) => (await getPosts()).find((p) => p.data.slug === slug)?.data.title;

/** GET /api/comments?slug=... : the approved comments for one post. */
export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug') ?? '';
  if (!(await postTitle(slug))) return json({ ok: false, message: 'Unknown post.' }, 404);
  if (!dbUrl()) return json({ ok: true, comments: [] });
  try {
    return json({ ok: true, comments: await approvedComments(slug) });
  } catch (err) {
    console.error('comments: load failed', err);
    return json({ ok: false, message: 'Comments could not be loaded right now.' }, 500);
  }
};

/** POST /api/comments : a reader leaves a comment. It is saved as pending and Mary is emailed. */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await readBody(request);
  const thanks = 'Thank you! Your comment will appear once Mary approves it.';
  if (body.website) return json({ ok: true, message: thanks }); // honeypot

  const slug = (body.slug ?? '').trim();
  const name = (body.name ?? '').trim().replace(/\s+/g, ' ').slice(0, LIMITS.name);
  const email = (body.email ?? '').trim().toLowerCase().slice(0, 200);
  const text = (body.comment ?? '').trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const notify = body.notify === 'on' || body.notify === 'true' || body.notify === '1';

  const title = await postTitle(slug);
  if (!title) return json({ ok: false, message: 'This post could not be found.' }, 400);
  if (!name || !text || !EMAIL_RE.test(email)) return json({ ok: false, message: 'Please add your name, a valid email, and your comment.' }, 400);
  if (text.length > LIMITS.body) return json({ ok: false, message: `Please keep your comment under ${LIMITS.body} characters.` }, 400);
  if (!dbUrl()) {
    console.error('comments: DATABASE_URL is not set in Vercel');
    return json({ ok: false, message: 'Comments are not available right now. Please try again later.' }, 503);
  }

  const ipHash = createHash('sha256').update(`${clientAddress ?? ''}|fau-comments`).digest('hex').slice(0, 32);
  try {
    const pool = await db();
    const recent = await pool.query(`SELECT 1 FROM comments WHERE ip_hash = $1 AND created_at > NOW() - INTERVAL '30 seconds' LIMIT 1`, [ipHash]);
    if (recent.rowCount) return json({ ok: false, message: 'Please wait a moment before posting again.' }, 429);

    const token = newToken();
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO comments (post_slug, name, email, body, notify, token, ip_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [slug, name, email, text, notify, token, ipHash],
    );
    const manage = absoluteUrl(`/comments/manage?id=${rows[0].id}&token=${token}`);
    const postUrl = absoluteUrl(`/blog/${slug}`);
    await sendMail({
      to: maryEmail(),
      replyTo: email,
      subject: `New comment on "${title}" from ${name}`,
      text: `${name} (${email}) left a comment on "${title}":\n\n${text}\n\nApprove, reply, or delete it here:\n${manage}\n\nPost: ${postUrl}\n\nIt will not show on the site until you approve it.`,
      html: emailHtml({
        heading: `New comment from ${name}`,
        paragraphs: [`On "${title}". It will not show on the site until you approve it.`, `${name}'s email: ${email}`],
        quote: text,
        buttons: [
          { label: 'Approve or reply', href: manage },
          { label: 'Delete', href: `${manage}&do=delete` },
        ],
      }),
    });
    return json({ ok: true, message: thanks });
  } catch (err) {
    console.error('comments: save failed', err);
    return json({ ok: false, message: 'Your comment could not be saved. Please try again in a moment.' }, 500);
  }
};
