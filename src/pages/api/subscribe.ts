import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { env, EMAIL_RE, readBody, wantsJson, json, safePath } from '../../lib/api';

export const prerender = false;

const SUCCESS = 'You are in, sis. Welcome to the community. ✨';
const EXISTS = 'You are already on the list. Glad you are here. 💜';

/**
 * Adds a newsletter signup to the Resend Audience.
 * Required Vercel environment variables: RESEND_API_KEY and RESEND_AUDIENCE_ID (or RESEND_SEGMENT_ID).
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);
  const asJson = wantsJson(request);
  const back = safePath(body.redirect);
  const reply = (ok: boolean, message: string, status: number, code?: string) =>
    asJson
      ? json({ ok, message }, status)
      : Response.redirect(new URL(`${back}?subscribed=${ok ? (code ?? '1') : '0'}${ok ? '' : `&reason=${encodeURIComponent(message)}`}#join`, request.url), 303);

  // Honeypot: real people never fill in the hidden "website" field. Pretend it worked so bots move on.
  if (body.website) return reply(true, SUCCESS, 200);

  const email = (body.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(false, 'Please enter a valid email address.', 400);

  const apiKey = env('RESEND_API_KEY');
  const segmentId = env('RESEND_SEGMENT_ID');
  const audienceId = env('RESEND_AUDIENCE_ID');
  if (!apiKey || (!segmentId && !audienceId)) {
    console.error('subscribe: RESEND_API_KEY and RESEND_AUDIENCE_ID (or RESEND_SEGMENT_ID) must be set in Vercel');
    return reply(false, 'Signups are not switched on yet. Please try again later or email Mary directly.', 503);
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = segmentId
      ? await resend.contacts.create({ email, unsubscribed: false, segments: [{ id: segmentId }] })
      : await resend.contacts.create({ email, unsubscribed: false, audienceId: audienceId as string });

    if (error) {
      const text = `${error.name ?? ''} ${error.message ?? ''}`.toLowerCase();
      if (text.includes('already') || text.includes('exists') || text.includes('duplicate')) return reply(true, EXISTS, 200, 'exists');
      console.error('subscribe: Resend error', error);
      return reply(false, 'Something went wrong on our end. Please try again in a moment.', 502);
    }

    console.log('subscribe: added contact', data?.id);
    return reply(true, SUCCESS, 200);
  } catch (err) {
    console.error('subscribe: unexpected error', err);
    return reply(false, 'Something went wrong on our end. Please try again in a moment.', 500);
  }
};

export const GET: APIRoute = () => json({ ok: false, message: 'Use POST with an email field.' }, 405);
