# Changelog

All notable changes to `@tada/kit`. Newest first. Apps pin a version by git tag (`#vX.Y.Z`).

## 0.1.7 — 2026-10-04

### Fixed
- `privateCheck`: the empty page is built per request (Workers refuse a `Response` created in
  global scope, so 0.1.6 could not be deployed).

## 0.1.6 — 2026-10-04

### Added
- `createApiProxy({ privateCheck })`: a private site's pages and files go only to users the API
  allows (2xx from the check path, e.g. `/admin/me`); everyone else signed in gets an empty page.
  Answers are cached per Access JWT for a minute; an unreachable API fails closed. Needs
  `assets.run_worker_first: true`.

## 0.1.5 — 2026-10-04

### Added
- `AccessGate` (`@tada/kit/account`): renders nothing while it checks and nothing at all on a 403.

## 0.1.4 — 2026-10-04

### Changed
- Account menu: "Ask for server storage" is highlighted (warning icon) and opens the feedback form
  on a request, which always carries the storage request while it can be asked for, plus an
  optional email to sync with. No stars on requests; stars default to 5.
- Users with server storage only rate and send messages.

### Added
- `openStorageRequest()` / the `tdz-account:request-storage` event, to open that form from a page.

## 0.1.3 — 2026-10-04

### Added
- Account menu links the author site by default (`author-url=""` hides it).

## 0.1.2 — 2026-10-04

### Added
- Account menu: `feedback-url` shows the app's average rating and a form to rate it, send a
  message or a request (optionally with an email to sync with), with a thank-you popup.
- `author-url`: link to the author's site.

## 0.1.1

### Added
- Account menu: optional Settings item.

## 0.1.0

- Shared modules of the apps: i18n, brand, account gate and menu, `/api` proxy, colour tokens.
