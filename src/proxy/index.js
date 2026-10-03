// Edge proxy for the apps' Workers: /api/* → the central API Worker (service binding `API`),
// everything else is the static build (binding `ASSETS`). Route only /api/* here
// (`assets.run_worker_first: ["/api/*"]`), or every path for a private site (`privateCheck`).
//
// Why: the browser then talks to the app's hostname only, so one Cloudflare Access login covers the
// app and its API calls (no second login, no cross-origin cookies). The API still verifies the
// Access JWT itself — this proxy adds no identity, it only forwards what Access attached.

/**
 * CSRF: a page on another site can send a simple POST that carries this host's Access cookie, and
 * Access then attaches a valid JWT. Browsers mark where a request comes from, so writes are only
 * allowed when they come from this origin (clients without these headers are not browsers).
 * @param {Request} request
 * @param {URL} [url]
 */
export function crossSiteWrite(request, url = new URL(request.url)) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return false;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site) return site !== "same-origin";
  const origin = request.headers.get("Origin");
  return origin !== null && origin !== url.origin;
}

const error = (status, code, message) => Response.json({ error: { code, message } }, { status });

// What a user without access gets for every page and file of a private site: an empty page.
// Built per request: Workers forbid creating a Response in global scope.
const empty = () =>
  new Response("<!doctype html><meta charset=utf-8><meta name=robots content=noindex><title></title>", {
  status: 403,
  headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
});

// Per-isolate cache of access answers by Access JWT, so the files of one page cost one API call.
const ACCESS_TTL_MS = 60_000;
const accessCache = new Map();

/** Asks the API (GET `path`, with the caller's Access JWT) whether this user may see the site. */
async function allowed(request, env, path) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return false;
  const hit = accessCache.get(jwt);
  if (hit && Date.now() - hit.at < ACCESS_TTL_MS) return hit.ok;
  let ok = false;
  try {
    const res = await env.API.fetch(
      new Request(new URL(path, env.API_PUBLIC_URL || "https://api.internal"), { headers: { "Cf-Access-Jwt-Assertion": jwt } }),
    );
    ok = res.ok;
  } catch {
    return false; // API unreachable: fail closed, and ask again next time
  }
  if (accessCache.size > 500) accessCache.clear();
  accessCache.set(jwt, { at: Date.now(), ok });
  return ok;
}

/**
 * @param {{ prefixes?: string[], privateCheck?: string }} [options]
 *   prefixes: API paths this app may reach, e.g. ["/v1/finance/"] (`/health` is always allowed).
 *   Least privilege: once an app is shared, strangers hold a valid Access JWT for its host, so only
 *   forward what the app itself calls. Omit to forward every path (the hub's admin UI).
 *   privateCheck: API path answering 2xx only for users allowed to see the site (e.g. "/admin/me"
 *   for owner only). Every page and file is then served only to them; anyone else signed in gets
 *   an empty page. Needs `assets.run_worker_first: true`. /api/* stays guarded by the API itself.
 * @returns {{ fetch: (request: Request, env: { API: Fetcher, ASSETS: Fetcher, API_PUBLIC_URL?: string }) => Promise<Response> }}
 */
export function createApiProxy({ prefixes, privateCheck } = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) {
        if (privateCheck && !(await allowed(request, env, privateCheck))) return empty();
        return env.ASSETS.fetch(request);
      }
      if (crossSiteWrite(request, url)) return error(403, "forbidden", "Cross-site request");

      const path = url.pathname.slice("/api".length);
      if (prefixes && path !== "/health" && !prefixes.some((p) => path.startsWith(p))) {
        return error(404, "not_found", "Not found");
      }

      // A service binding ignores the host. API_PUBLIC_URL (optional) only matters for absolute
      // links the API builds from the request URL (e.g. blog media); otherwise a placeholder is used.
      const target = new URL(path || "/", env.API_PUBLIC_URL || "https://api.internal");
      target.search = url.search;

      const headers = new Headers(request.headers);
      headers.delete("Cookie"); // the API authenticates with the Cf-Access-Jwt-Assertion header only

      return env.API.fetch(
        new Request(target, {
          method: request.method,
          headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
          redirect: "manual",
        }),
      );
    },
  };
}
