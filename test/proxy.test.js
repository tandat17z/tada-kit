import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiProxy } from "../src/proxy/index.js";

// Node requires `duplex` for streamed bodies; Workers does not. Shim it for the proxy under test.
const NodeRequest = globalThis.Request;
globalThis.Request = class extends NodeRequest {
  constructor(input, init = {}) {
    super(input, init.body ? { ...init, duplex: "half" } : init);
  }
};

const seen = [];
const env = {
  API: { fetch: async (req) => (seen.push(req), new Response("api")) },
  ASSETS: { fetch: async () => new Response("asset") },
};
const call = (proxy, path, init = {}) => {
  const body = init.method && init.method !== "GET" ? "{}" : undefined;
  return proxy.fetch(new Request(`https://app.test${path}`, { ...init, body }), env);
};

test("non-/api paths go to the static assets", async () => {
  assert.equal(await (await call(createApiProxy(), "/stats")).text(), "asset");
});

test("cross-site writes are refused, same-origin and non-browser writes pass", async () => {
  const proxy = createApiProxy();
  const status = async (method, headers) => (await call(proxy, "/api/v1/x", { method, headers })).status;
  assert.equal(await status("POST", { "Sec-Fetch-Site": "cross-site" }), 403);
  assert.equal(await status("POST", { "Sec-Fetch-Site": "same-site" }), 403);
  assert.equal(await status("DELETE", { Origin: "https://evil.example" }), 403);
  assert.equal(await status("POST", { "Sec-Fetch-Site": "same-origin" }), 200);
  assert.equal(await status("PUT", { Origin: "https://app.test" }), 200);
  assert.equal(await status("POST", {}), 200);
  assert.equal(await status("GET", { "Sec-Fetch-Site": "cross-site" }), 200);
});

test("prefixes limit the API paths; /health always passes", async () => {
  const proxy = createApiProxy({ prefixes: ["/v1/finance/"] });
  assert.equal((await call(proxy, "/api/v1/finance/tx")).status, 200);
  assert.equal((await call(proxy, "/api/health")).status, 200);
  assert.equal((await call(proxy, "/api/admin/me")).status, 404);
  assert.equal((await call(proxy, "/api/v1/finance/%2e%2e/x/../../admin")).status, 404);
});

test("forwards without cookies, keeps the query", async () => {
  seen.length = 0;
  await call(createApiProxy(), "/api/v1/x?a=1", { headers: { Cookie: "CF_Authorization=t", "Cf-Access-Jwt-Assertion": "jwt" } });
  const [req] = seen;
  assert.equal(new URL(req.url).pathname + new URL(req.url).search, "/v1/x?a=1");
  assert.equal(req.headers.get("Cookie"), null);
  assert.equal(req.headers.get("Cf-Access-Jwt-Assertion"), "jwt");
});

test("privateCheck: pages only for users the API allows, an empty page for the rest", async () => {
  const proxy = createApiProxy({ privateCheck: "/admin/me" });
  const asked = [];
  const privateEnv = {
    ...env,
    API: {
      fetch: async (req) => {
        asked.push(new URL(req.url).pathname);
        return new Response(null, { status: req.headers.get("Cf-Access-Jwt-Assertion") === "owner" ? 200 : 403 });
      },
    },
  };
  const page = (jwt) =>
    proxy.fetch(new Request("https://app.test/", { headers: jwt ? { "Cf-Access-Jwt-Assertion": jwt } : {} }), privateEnv);

  assert.equal(await (await page("owner")).text(), "asset");
  const denied = await page("guest");
  assert.equal(denied.status, 403);
  assert.doesNotMatch(await denied.text(), /asset/);
  assert.equal((await page()).status, 403); // no Access JWT at all
  await page("owner"); // cached: no second API call for the same JWT
  assert.deepEqual(asked, ["/admin/me", "/admin/me"]);
});
