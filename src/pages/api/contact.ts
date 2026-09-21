import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { env, EMAIL_RE, readBody, wantsJson, json } from '../../lib/api';

export const prerender = false;

const TO_DEFAULT = 'mgeter@fiftyandunfiltered.com';
const FALLBACK = `Your message could not be sent. Please email Mary directly at ${TO_DEFAULT}.`;

/**
 * Delivers the contact form to Mary's inbox through Resend.
 * Required Vercel environment variables: RESEND_API_KEY and CONTACT_FROM_EMAIL (an address on a domain verified in Resend).
 * Optional: CONTACT_TO_EMAIL (defaults to mgeter@fiftyandunfiltered.com).
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);
  const asJson = wantsJson(request);
  const reply = (ok: boolean, message: string, status: number) =>
    asJson
      ? json({ ok, message }, status)
      : Response.redirect(new URL(`/contact?sent=${ok ? '1' : '0'}${ok ? '' : `&reason=${encodeURIComponent(message)}`}`, request.url), 303);

  if (body.website) return reply(true, 'Your message has been sent.', 200); // honeypot

  const name = (body.name ?? '').trim().slice(0, 200);
  const email = (body.email ?? '').trim().toLowerCase();
  const topic = (body.topic ?? 'General Message').trim().slice(0, 100);
  const message = (body.message ?? '').trim().slice(0, 5000);
  if (!name || !message || !EMAIL_RE.test(email)) return reply(false, 'Please fill in your name, a valid email, and a message.', 400);

  const apiKey = env('RESEND_API_KEY');
  const from = env('CONTACT_FROM_EMAIL');
  const to = env('CONTACT_TO_EMAIL') || TO_DEFAULT;
  if (!apiKey || !from) {
    console.error('contact: RESEND_API_KEY and CONTACT_FROM_EMAIL must be set in Vercel');
    return reply(false, FALLBACK, 503);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `[Website] ${topic} from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}\n\n--\nSent from the contact form at fiftyandunfiltered.com`,
    });
    if (error) {
      console.error('contact: Resend error', error);
      return reply(false, FALLBACK, 502);
    }
    return reply(true, 'Your message has been sent. Mary will be in touch soon. 💕', 200);
  } catch (err) {
    console.error('contact: unexpected error', err);
    return reply(false, FALLBACK, 500);
  }
};

export const GET: APIRoute = () => json({ ok: false, message: 'Use POST.' }, 405);
