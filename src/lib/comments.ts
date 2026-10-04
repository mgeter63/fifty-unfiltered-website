import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { Resend } from 'resend';
import { env } from './api';
import { SITE } from './posts';

/**
 * Blog comments, stored in the Neon Postgres database connected to the Vercel project.
 * Required Vercel environment variables: DATABASE_URL (added automatically by the Neon integration),
 * plus RESEND_API_KEY and CONTACT_FROM_EMAIL (already used by the contact form).
 * Optional: COMMENTS_TO_EMAIL, otherwise CONTACT_TO_EMAIL, otherwise mgeter@fiftyandunfiltered.com.
 *
 * Every comment starts as "pending". Mary gets an email with a private link where she can
 * approve, reply, or delete it. Only approved comments and Mary's replies are shown on the site.
 */

export const AUTHOR_NAME = SITE.author;
export const LIMITS = { name: 80, body: 3000 };

export type CommentRow = {
  id: number;
  post_slug: string;
  parent_id: number | null;
  name: string;
  email: string | null;
  body: string;
  status: 'pending' | 'approved' | 'deleted';
  is_author: boolean;
  notify: boolean;
  token: string;
  ip_hash: string | null;
  created_at: Date;
};

export type PublicComment = { id: number; name: string; body: string; isAuthor: boolean; date: string; replies: PublicComment[] };

let pool: pg.Pool | undefined;
let schemaReady: Promise<void> | undefined;

export const dbUrl = () => env('DATABASE_URL') || env('POSTGRES_URL');

function getPool(): pg.Pool {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  pool ??= new pg.Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000 });
  return pool;
}

/** Creates the table the first time it is needed, so nothing has to be set up by hand in Neon. */
export async function db(): Promise<pg.Pool> {
  const p = getPool();
  schemaReady ??= p
    .query(
      `CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_slug TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        is_author BOOLEAN NOT NULL DEFAULT FALSE,
        notify BOOLEAN NOT NULL DEFAULT FALSE,
        token TEXT NOT NULL,
        ip_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS comments_post_status ON comments (post_slug, status);`,
    )
    .then(() => undefined)
    .catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  await schemaReady;
  return p;
}

export const newToken = () => randomBytes(24).toString('hex');

/** Approved comments for one post, oldest first, with Mary's replies nested under each one. Emails are never included. */
export async function approvedComments(slug: string): Promise<PublicComment[]> {
  const { rows } = await (await db()).query<CommentRow>(
    `SELECT * FROM comments WHERE post_slug = $1 AND status = 'approved' ORDER BY created_at ASC, id ASC`,
    [slug],
  );
  const toPublic = (r: CommentRow): PublicComment => ({
    id: r.id,
    name: r.name,
    body: r.body,
    isAuthor: r.is_author,
    date: new Date(r.created_at).toISOString(),
    replies: [],
  });
  const top = rows.filter((r) => r.parent_id === null).map(toPublic);
  const byId = new Map(top.map((c) => [c.id, c]));
  rows.filter((r) => r.parent_id !== null).forEach((r) => byId.get(r.parent_id!)?.replies.push(toPublic(r)));
  return top;
}

export async function findComment(id: number, token: string): Promise<CommentRow | undefined> {
  if (!Number.isInteger(id) || id < 1 || !/^[a-f0-9]{48}$/.test(token)) return undefined;
  const { rows } = await (await db()).query<CommentRow>(`SELECT * FROM comments WHERE id = $1 AND token = $2 AND parent_id IS NULL`, [id, token]);
  return rows[0];
}

export async function repliesTo(id: number): Promise<CommentRow[]> {
  const { rows } = await (await db()).query<CommentRow>(
    `SELECT * FROM comments WHERE parent_id = $1 AND status = 'approved' ORDER BY created_at ASC, id ASC`,
    [id],
  );
  return rows;
}

/** Sends one email through Resend. Returns false (and logs) instead of throwing, so a mail hiccup never loses a comment. */
export async function sendMail(opts: { to: string; subject: string; text: string; html: string; replyTo?: string }): Promise<boolean> {
  const apiKey = env('RESEND_API_KEY');
  const from = env('CONTACT_FROM_EMAIL');
  if (!apiKey || !from) {
    console.error('comments: RESEND_API_KEY and CONTACT_FROM_EMAIL must be set in Vercel');
    return false;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from, to: [opts.to], subject: opts.subject, text: opts.text, html: opts.html, replyTo: opts.replyTo });
    if (error) console.error('comments: Resend error', error);
    return !error;
  } catch (err) {
    console.error('comments: email failed', err);
    return false;
  }
}

export const maryEmail = () => env('COMMENTS_TO_EMAIL') || env('CONTACT_TO_EMAIL') || SITE.email;

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A simple branded email: a heading, a few paragraphs, an optional quoted comment, and buttons. */
export function emailHtml(opts: { heading: string; paragraphs: string[]; quote?: string; buttons: { label: string; href: string }[] }) {
  const p = opts.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#1A1A1A;">${escapeHtml(t)}</p>`).join('');
  const quote = opts.quote
    ? `<div style="border-left:4px solid #D4AF37;background:#F7F3EA;padding:14px 16px;margin:0 0 20px;font-size:16px;line-height:1.6;color:#1A1A1A;white-space:pre-wrap;">${escapeHtml(opts.quote)}</div>`
    : '';
  const buttons = opts.buttons
    .map(
      (b, i) =>
        `<a href="${escapeHtml(b.href)}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 20px;background:${i === 0 ? '#CC0066' : '#1A1A1A'};color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(b.label)}</a>`,
    )
    .join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">
  <div style="font-weight:bold;letter-spacing:2px;text-transform:uppercase;font-size:13px;color:#CC0066;margin-bottom:16px;">Fifty &amp; Unfiltered</div>
  <h1 style="font-size:22px;margin:0 0 16px;color:#1A1A1A;">${escapeHtml(opts.heading)}</h1>
  ${p}${quote}${buttons}
  <p style="margin:24px 0 0;font-size:12px;color:#777;">fiftyandunfiltered.com</p>
</div>`;
}
