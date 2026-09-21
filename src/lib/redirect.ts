import type { APIRoute } from 'astro';

/** Permanent redirect used for old Squarespace sections whose individual pages no longer exist. */
export const permanentRedirectTo =
  (destination: string): APIRoute =>
  ({ request }) =>
    Response.redirect(new URL(destination, request.url), 301);
