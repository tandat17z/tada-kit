# tada-kit

Shared modules of the tandat17z apps (DaFinance, DaGym, the hub, DaTrade, the personal site).
One repository, one version; each module is imported on its own, so an app only bundles what it uses.

| Import | What | Needs |
|---|---|---|
| `@tada/kit/i18n` | `createI18n` → `I18nProvider`, `useI18n`, `LanguageSwitch` ([README](src/i18n/README.md)) | React, Tailwind + tokens |
| `@tada/kit/layout` | `AppHeader`, `AppMain`, `headerTabClass`: the shared page shell and width ([README](src/layout/README.md)) | React, Tailwind + tokens |
| `@tada/kit/theme` | `applyTheme`, `ThemePicker`: dark / light switch ([README](src/theme/README.md)); the light colours are in `tokens.css` | React, Tailwind + tokens |
| `@tada/kit/brand` | `AppBrand`: logo, name, version, changelog dialog ([README](src/brand/README.md)) | React, Tailwind + tokens |
| `@tada/kit/account` | Account types, `AccountGate`, `AccessGate` (private: nothing for users without access), `useAccount`, account-menu events | React, Tailwind + tokens |
| `@tada/kit/account-menu` | Defines `<tdz-account>` (sign-in / account menu) and its JSX types | nothing |
| `@tada/kit/proxy` | `createApiProxy({ prefixes, privateCheck })`, `crossSiteWrite` for the apps' Workers | nothing |
| `@tada/kit/tokens.css` | Colour tokens + Tailwind theme; also tells Tailwind to scan the kit | Tailwind v4 |

The kit ships source (TypeScript / plain JS / CSS), no build step: Vite and wrangler compile it with
the app. Next.js needs `transpilePackages: ["@tada/kit"]`.

## Install

From a git tag (the repository is public, so clones and Cloudflare Workers Builds can install it):

```json
"dependencies": { "@tada/kit": "github:tandat17z/tada-kit#v0.1.8" }
```

## Use

```css
/* src/index.css */
@import 'tailwindcss';
@import '@tada/kit/tokens.css';
```

```ts
// src/main.tsx — defines <tdz-account> (side effect only)
import '@tada/kit/account-menu'
```

```js
// worker/index.js
import { createApiProxy } from "@tada/kit/proxy";
export default createApiProxy({ prefixes: ["/v1/finance/"] });
```

```tsx
<AccountGate
  fetchAccount={() => apiFetch<Account>('/account')}
  onReadonly={(a) => pullServerToLocal(a.email)}
  storeFor={(onServer, email) => (onServer ? serverStore : localStore(email))}
  provide={(store, children) => <StoreContext value={store}>{children}</StoreContext>}
>
  <App />
</AccountGate>
```

## Recipes for a new app

The central API gives every app the same account routes (`/v1/<app>/account`, `/v1/<app>/feedback`),
so these features need no code of their own: point the kit at them.

### Account menu with storage, rating & feedback

```tsx
<tdz-account
  lang={locale}
  me-url={`${API}/v1/<app>/me`}           // email fallback in dev (optional)
  account-url={`${API}/v1/<app>/account`} // where data lives + server-storage / sync requests
  feedback-url={`${API}/v1/<app>/feedback`} // average stars + rate & feedback form
  settings                                // optional: a Settings item (fires tdz-account:settings)
/>
```

What the user gets, all inside the menu:

- **Rating** (average and count) and a **Rate & feedback** form: stars (5 by default) and a message.
- **Requests** (always available): a note is required; while the data is not on the server the
  request also asks for **server storage**, and an optional **email to sync with** sends an
  account link. Asking again refreshes the pending request. The owner is told on Telegram and
  decides in the hub (Quyền truy cập; messages in Góp ý).
- A highlighted **Ask for server storage** button when the data is only in the browser. From the
  page (e.g. a banner): `openStorageRequest()` from `@tada/kit/account` opens the same form.
- A thank-you popup after sending, and an **About the author** link (`author-url=""` hides it).

### Language switch in the menu

```tsx
// React app: switch in place.
<tdz-account lang={locale} languages={Object.keys(LOCALES).join(';')} />
useEffect(() => {
  const on = (e: Event) => { e.preventDefault(); setLocale((e as CustomEvent).detail.code) }
  window.addEventListener('tdz-account:language', on)
  return () => window.removeEventListener('tdz-account:language', on)
}, [setLocale])
```

```html
<!-- Static site: one link per language. -->
<tdz-account lang="vi" languages="en=/about/;vi=/vi/about/" login-url="/login/"></tdz-account>
```

### Public site (guests)

With `feedback-url` or `languages`, a signed-out visitor gets a guest menu: rating & feedback,
language and **Sign in** (`login-url`). On an app set to **public** in the hub, guests rate it
anonymously (the API keys them by a hash of their IP); signed-in users rate by email.

### Private site (owner only)

Two layers, both from the kit. In the Worker, every page and file goes only to users the API
accepts (here: owner emails at `/admin/me`); anyone else signed in gets an empty page:

```js
// worker/index.js, with "assets": { "run_worker_first": true } in wrangler.jsonc
export default createApiProxy({ privateCheck: "/admin/me" });
```

In the page, nothing renders until the check passes (and nothing at all on a 403):

```tsx
<AccessGate check={() => fetch(`${API}/admin/me`, { credentials: 'include' }).then((r) => r.status)}>
  <App />
</AccessGate>
```

For an app whose access mode is set in the hub (private / shared), `AccountGate` already follows
`/v1/<app>/account`: a private app answers 403 `forbidden` and the app shows nothing.

A static site without a bundler copies the account menu instead:

```json
"scripts": { "postinstall": "tada-copy-account-menu public/assets/account.js" }
```

## Change the kit

1. Edit, then `npm run typecheck` and `npm test`.
2. Try it in an app before tagging: `npm install ../../kit` there (or `npm link`), then restore the tag.
3. Bump `version`, commit, tag `vX.Y.Z`, push with tags.
4. In each app: change the tag in `package.json`, `npm install`, lint, build.
