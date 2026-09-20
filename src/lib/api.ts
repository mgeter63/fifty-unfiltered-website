/** Small helpers shared by the API routes. */

export const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' && process.env?.[name]) || (import.meta.env as Record<string, string | undefined>)[name];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Read a POST body sent either as JSON (from the site's JavaScript) or as a regular form post. */
export async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const data = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
  }
  const form = await request.formData().catch(() => new FormData());
  return Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, typeof v === 'string' ? v : '']));
}

export const wantsJson = (request: Request) =>
  (request.headers.get('accept') ?? '').includes('application/json') ||
  (request.headers.get('content-type') ?? '').includes('application/json');

export const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

/** Only allow redirects back to a path on this site, never to another domain. */
export const safePath = (p: string | undefined) => (p && /^\/(?!\/)[^\s]*$/.test(p) ? p : '/');
