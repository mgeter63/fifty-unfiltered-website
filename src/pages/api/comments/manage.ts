import type { APIRoute } from 'astro';
import { readBody } from '../../../lib/api';
import { getPosts, absoluteUrl } from '../../../lib/posts';
import { AUTHOR_NAME, db, emailHtml, findComment, LIMITS, newToken, sendMail } from '../../../lib/comments';

export const prerender = false;

/**
 * POST /api/comments/manage : Mary approves, deletes, or replies to a comment from the private
 * link in her notification email. The comment's own secret token is the permission check.
 * Always redirects back to the manage page with a short status.
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);
  const id = Number(body.id);
  const token = body.token ?? '';
  const back = (done: string) =>
    Response.redirect(new URL(`/comments/manage?id=${id}&token=${encodeURIComponent(token)}&done=${done}`, request.url), 303);

  try {
    const comment = await findComment(id, token);
    if (!comment) return Response.redirect(new URL('/comments/manage?done=notfound', request.url), 303);
    const pool = await db();

    if (body.action === 'approve') {
      await pool.query(`UPDATE comments SET status = 'approved' WHERE id = $1`, [id]);
      return back('approved');
    }

    if (body.action === 'delete') {
      await pool.query(`UPDATE comments SET status = 'deleted' WHERE id = $1 OR parent_id = $1`, [id]);
      return back('deleted');
    }

    if (body.action === 'reply') {
      const text = (body.reply ?? '').trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, LIMITS.body);
      if (!text) return back('empty');
      // Replying also approves the reader's comment, so the reply never shows under a hidden comment.
      await pool.query(`UPDATE comments SET status = 'approved' WHERE id = $1`, [id]);
      const { rows } = await pool.query<{ id: number }>(
        `INSERT INTO comments (post_slug, parent_id, name, body, status, is_author, token) VALUES ($1, $2, $3, $4, 'approved', TRUE, $5) RETURNING id`,
        [comment.post_slug, id, AUTHOR_NAME, text, newToken()],
      );

      if (comment.notify && comment.email) {
        const title = (await getPosts()).find((p) => p.data.slug === comment.post_slug)?.data.title ?? 'Fifty and Unfiltered';
        const link = absoluteUrl(`/blog/${comment.post_slug}#comment-${rows[0].id}`);
        await sendMail({
          to: comment.email,
          subject: `Mary replied to your comment on "${title}"`,
          text: `Hi ${comment.name},\n\nMary Geter replied to your comment on "${title}":\n\n${text}\n\nRead it and keep the conversation going:\n${link}\n\nFifty and Unfiltered`,
          html: emailHtml({
            heading: `Mary replied to you, ${comment.name}`,
            paragraphs: [`Here is what Mary Geter said about your comment on "${title}":`],
            quote: text,
            buttons: [{ label: 'Read the conversation', href: link }],
          }),
        });
      }
      return back('replied');
    }

    return back('unknown');
  } catch (err) {
    console.error('comments: manage failed', err);
    return back('error');
  }
};
