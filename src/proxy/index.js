// Edge proxy for the apps' Workers: /api/* → the central API Worker (service binding `API`),
// everything else is the static build (binding `ASSETS`). Route only /api/* here
// (`assets.run_worker_first: ["/api/*"]`).
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

/**
 * @param {{ prefixes?: string[] }} [options]
 *   prefixes: API paths this app may reach, e.g. ["/v1/finance/"] (`/health` is always allowed).
 *   Least privilege: once an app is shared, strangers hold a valid Access JWT for its host, so only
 *   forward what the app itself calls. Omit to forward every path (the hub's admin UI).
 * @returns {{ fetch: (request: Request, env: { API: Fetcher, ASSETS: Fetcher, API_PUBLIC_URL?: string }) => Promise<Response> }}
 */
export function createApiProxy({ prefixes } = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
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
