# CLAUDE.md

**tada-kit** (`@tada/kit`): modules shared by the tandat17z apps. See README for the module list and usage.

## Rules

- **Public repository.** No hostnames of the deployed apps, hub or API, no Cloudflare ids, no emails,
  no secrets. Hosts are passed in by the apps (attributes, env, props). One exception, public on
  purpose: the author site `https://www.tandat17z.workers.dev` (default `author-url` of the menu).
- **Knows nothing about the apps.** No app names, routes, stores or messages in here; anything
  app-specific comes in through props / options. Add a module only when two apps share it.
- **No build step.** Ship TypeScript / plain JS / CSS source; `exports` in package.json lists every
  public entry. `account/menu.js` and `proxy/` stay plain JS (also used without a bundler / in Workers).
- **Versioned by git tag.** Apps pin `github:tandat17z/tada-kit#vX.Y.Z`. A breaking change bumps the
  minor version while < 1.0 and is noted in the commit message.
- Code, comments, docs: English. UI text inside components comes from the app (labels props) or the
  built-in `en` / `vi` labels.
- Before tagging: `npm run typecheck` and `npm test` pass, and at least one app builds with the change.
