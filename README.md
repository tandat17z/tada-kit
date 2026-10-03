# tada-kit

Shared modules of the tandat17z apps (DaFinance, DaGym, the hub, DaTrade, the personal site).
One repository, one version; each module is imported on its own, so an app only bundles what it uses.

| Import | What | Needs |
|---|---|---|
| `@tada/kit/i18n` | `createI18n` → `I18nProvider`, `useI18n`, `LanguageSwitch` ([README](src/i18n/README.md)) | React, Tailwind + tokens |
| `@tada/kit/brand` | `AppBrand`: logo, name, version, changelog dialog ([README](src/brand/README.md)) | React, Tailwind + tokens |
| `@tada/kit/account` | Account types, `AccountGate`, `useAccount`, account-menu events | React, Tailwind + tokens |
| `@tada/kit/account-menu` | Defines `<tdz-account>` (sign-in / account menu) and its JSX types | nothing |
| `@tada/kit/proxy` | `createApiProxy({ prefixes })`, `crossSiteWrite` for the apps' Workers | nothing |
| `@tada/kit/tokens.css` | Colour tokens + Tailwind theme; also tells Tailwind to scan the kit | Tailwind v4 |

The kit ships source (TypeScript / plain JS / CSS), no build step: Vite and wrangler compile it with
the app. Next.js needs `transpilePackages: ["@tada/kit"]`.

## Install

From a git tag (the repository is public, so clones and Cloudflare Workers Builds can install it):

```json
"dependencies": { "@tada/kit": "github:tandat17z/tada-kit#v0.1.0" }
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

A static site without a bundler copies the account menu instead:

```json
"scripts": { "postinstall": "tada-copy-account-menu public/assets/account.js" }
```

## Change the kit

1. Edit, then `npm run typecheck` and `npm test`.
2. Try it in an app before tagging: `npm install ../../kit` there (or `npm link`), then restore the tag.
3. Bump `version`, commit, tag `vX.Y.Z`, push with tags.
4. In each app: change the tag in `package.json`, `npm install`, lint, build.
