import { permanentRedirectTo } from '../../lib/redirect';

// Old Squarespace pages under this folder no longer exist: send visitors and Google to the blog (301).
export const prerender = false;
export const GET = permanentRedirectTo('/blog');
export const ALL = permanentRedirectTo('/blog');
