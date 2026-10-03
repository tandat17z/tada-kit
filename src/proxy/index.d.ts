export interface ApiProxyEnv {
  API: { fetch: (request: Request) => Promise<Response> }
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  API_PUBLIC_URL?: string
}

/** True for a write (not GET / HEAD / OPTIONS) that a browser marks as coming from another origin. */
export function crossSiteWrite(request: Request, url?: URL): boolean

/** Worker handler: /api/* → the API service binding (CSRF-checked, path-limited), the rest → assets. */
export function createApiProxy(options?: { prefixes?: string[] }): {
  fetch: (request: Request, env: ApiProxyEnv) => Promise<Response>
}
