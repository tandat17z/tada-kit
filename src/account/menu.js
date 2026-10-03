// <tdz-account> — sign-in / account menu for every tandat17z site, backed by Cloudflare Access.
// Self-contained (no dependencies, no build). Part of @tada/kit: Vite apps import it
// (`import "@tada/kit/account-menu"`), static sites copy it with the kit's copy-account-menu script.
//
// Attributes:
//   lang        "vi" (default) | "en"
//   login-url   where "Sign in" points (an Access-protected path, e.g. "/login/"). Without it,
//               nothing is shown when nobody is signed in (sites fully behind Access).
//   admin-url   optional endpoint returning 200 for admins / 403 otherwise, to show admin rights.
//   me-url      optional fallback returning { email } when Access identity is unavailable (dev).
//   account-url optional central-API account endpoint (/v1/<app>/account) of a shared app: shows
//               where the user's data is stored and lets a user without server storage ask the
//               owner for it (POST <account-url>/request). Also an email fallback, like me-url.
//   feedback-url optional central-API feedback endpoint (/v1/<app>/feedback): shows the app's
//               average rating and a form to rate it (1-5 stars) and send a request or a message
//               to the owner (POST <feedback-url>). With account-url, a request may also name an
//               email to sync with: it is sent as an account link (POST <account-url>/link), which
//               the owner approves in the hub. A user without server storage asks for it from
//               this form too: "Ask for server storage" (or the page firing
//               "tdz-account:request-storage") opens the menu with the form set to that request.
//   author-url  link to the author's site at the bottom of the menu; defaults to AUTHOR_URL,
//               author-url="" hides it.
//   settings    optional (boolean): adds a "Settings" item; clicking it closes the menu and fires
//               "tdz-account:settings" on window, so the page opens its own settings.
//
// Events on window: listens to "tdz-account:refresh" (re-read the account, e.g. after the page sent
// a request itself) and "tdz-account:request-storage" (open the menu on the storage request form),
// fires "tdz-account:change" after a request sent from the menu and
// "tdz-account:settings" when the Settings item is clicked.
//
// Identity comes from /cdn-cgi/access/get-identity on the current host; sign-out uses
// /cdn-cgi/access/logout. No tokens are read or stored here.
(() => {
  if (typeof customElements === "undefined" || customElements.get("tdz-account")) return; // SSR, or loaded twice

  // The author's public site, linked from every app's menu.
  const AUTHOR_URL = "https://www.tandat17z.workers.dev";

  const TEXT = {
    vi: { signIn: "Đăng nhập", signOut: "Đăng xuất", settings: "Cài đặt", account: "Tài khoản", via: "Đăng nhập qua", admin: "Quyền quản trị", yes: "Có", no: "Không",
      storage: "Lưu dữ liệu", cloud: "Server", local: "Trình duyệt này", readonly: "Trình duyệt (server chỉ xem)",
      request: "Yêu cầu lưu trên server", pending: "Đã gửi yêu cầu, đang chờ duyệt.", rejected: "Yêu cầu trước chưa được chấp nhận.",
      message: "Lời nhắn (không bắt buộc)", send: "Gửi", cancel: "Huỷ", cooldown: "Gửi lại được sau một ngày.", failed: "Không gửi được, thử lại sau.",
      rating: "Đánh giá", noRating: "Chưa có", feedback: "Đánh giá & góp ý", yourRating: "Đánh giá của bạn", rated: "đã chấm", star: "sao",
      kindMessage: "Lời nhắn", kindRequest: "Yêu cầu", feedbackText: "Bạn muốn nhắn gì? (không bắt buộc)", thanks: "Cảm ơn bạn đã góp ý!",
      limit: "Hôm nay bạn đã gửi nhiều rồi, mai gửi tiếp nhé.", author: "Về tác giả",
      syncWith: "Đồng bộ với email (để trống: tạo mới)", badEmail: "Email không hợp lệ.", linkInvalid: "Không liên kết được với email này.",
      linked: "Tài khoản đã được liên kết rồi.", linkSent: "Đã gửi yêu cầu đồng bộ, chờ duyệt.",
      thanksTitle: "Cảm ơn bạn!", thanksRating: "Đánh giá của bạn đã được ghi nhận.",
      thanksMessage: "Lời nhắn đã được gửi tới tác giả. Mọi góp ý đều giúp ứng dụng tốt hơn.",
      thanksRequest: "Yêu cầu đã được gửi tới tác giả, bạn sẽ sớm nhận được phản hồi.",
      thanksSync: "Yêu cầu đồng bộ với {email} đang chờ duyệt.", close: "Đóng",
      askStorage: "Xin lưu dữ liệu trên server", askStorageHint: "Giữ dữ liệu an toàn và dùng trên mọi thiết bị.",
      syncHint: "Đã có tài khoản khác? Ghi email đó để dùng chung dữ liệu.", sendRequest: "Gửi yêu cầu", requestText: "Bạn cần gì? (bắt buộc)", noteRequired: "Hãy ghi vài dòng cho yêu cầu này.",
      thanksStorage: "Yêu cầu lưu dữ liệu trên server đang chờ duyệt." },
    en: { signIn: "Sign in", signOut: "Sign out", settings: "Settings", account: "Account", via: "Signed in with", admin: "Admin rights", yes: "Yes", no: "No",
      storage: "Data stored", cloud: "Server", local: "This browser", readonly: "Browser (server read-only)",
      request: "Ask for server storage", pending: "Request sent, waiting for approval.", rejected: "Your last request was not approved.",
      message: "Message (optional)", send: "Send", cancel: "Cancel", cooldown: "You can ask again after a day.", failed: "Could not send, try again later.",
      rating: "Rating", noRating: "None yet", feedback: "Rate & feedback", yourRating: "Your rating", rated: "rated", star: "stars",
      kindMessage: "Message", kindRequest: "Request", feedbackText: "Anything to tell us? (optional)", thanks: "Thanks for your feedback!",
      limit: "That is a lot for today, try again tomorrow.", author: "About the author",
      syncWith: "Sync with email (empty: start new)", badEmail: "Invalid email.", linkInvalid: "Cannot link to this email.",
      linked: "This account is already linked.", linkSent: "Sync request sent, waiting for approval.",
      thanksTitle: "Thank you!", thanksRating: "Your rating has been saved.",
      thanksMessage: "Your message has been sent to the author. Every bit of feedback makes the app better.",
      thanksRequest: "Your request has been sent to the author, you will hear back soon.",
      thanksSync: "The request to sync with {email} is waiting for approval.", close: "Close",
      askStorage: "Ask to store my data on the server", askStorageHint: "Keeps your data safe and on every device.",
      syncHint: "Have another account? Enter its email to share its data.", sendRequest: "Send request", requestText: "What do you need? (required)", noteRequired: "Please add a few words to this request.",
      thanksStorage: "Your request for server storage is waiting for approval." },
  };

  const initials = (name, email) => {
    const words = (name || email).split(/[\s@._-]+/).filter(Boolean);
    return (name ? [words[0], words.at(-1)] : [words[0]]).map((w) => (w ? w[0] : "")).join("").toUpperCase();
  };

  const getJson = async (url) => {
    try {
      const res = await fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } });
      return { status: res.status, body: res.ok ? await res.json() : null };
    } catch {
      return { status: 0, body: null };
    }
  };

  const postJson = async (url, body) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    } catch {
      return { status: 0, body: null };
    }
  };

  // Colors follow each site's CSS variables when present (hub/DaFinance/web names, then DaTraaa's
  // --ink/--border), with the shared dark palette as the last fallback.
  const CSS = `
    :host { position: relative; display: inline-flex; font: 500 13px/1.4 var(--font-sans, var(--sans, ui-sans-serif, system-ui, sans-serif)); color: var(--fg, var(--ink, #e7e9ec)); }
    button, a { font: inherit; color: inherit; }
    .login { display: inline-flex; align-items: center; height: 32px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border-strong, var(--border, #2d3239)); text-decoration: none; }
    .login:hover, .logout:hover, .settings:hover { background: var(--surface-2, #14171b); }
    .avatar { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border-radius: 999px; cursor: pointer;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); background: var(--surface-2, #14171b); color: var(--accent, #7ee0c3);
      font: 600 12px/1 var(--font-mono, var(--mono, ui-monospace, monospace)); }
    .avatar.warn { border-color: #f2c46d99; color: #f2c46d; }
    .avatar:focus-visible, .login:focus-visible, .logout:focus-visible, .settings:focus-visible { outline: 2px solid var(--accent, #7ee0c3); outline-offset: 2px; }
    .panel { position: absolute; top: calc(100% + 8px); right: 0; z-index: 60; width: 272px; padding: 16px; border-radius: 12px;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); background: var(--surface, #0f1114); box-shadow: 0 16px 40px #0008; }
    .who { display: flex; gap: 12px; align-items: center; }
    .who .avatar { width: 40px; height: 40px; cursor: default; font-size: 14px; }
    .name { font-weight: 600; }
    .email { color: var(--muted, #9ba2ac); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .who > div { min-width: 0; }
    dl { margin: 14px 0 0; padding-top: 12px; border-top: 1px solid var(--border, #1f2328); font-size: 12px; display: grid; gap: 6px; }
    dl div { display: flex; justify-content: space-between; gap: 12px; }
    dt { color: var(--subtle, var(--muted, #8a919c)); } dd { margin: 0; color: var(--muted, #9ba2ac); }
    dd.yes { color: var(--accent, #7ee0c3); } dd.no { color: #f2c46d; }
    .logout { display: flex; align-items: center; justify-content: center; height: 36px; margin-top: 14px; border-radius: 8px;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); text-decoration: none; }
    .settings { display: flex; align-items: center; gap: 8px; width: 100%; height: 36px; margin-top: 14px; padding: 0 10px; border-radius: 8px;
      border: 1px solid var(--border, #1f2328); background: transparent; cursor: pointer; text-align: left; }
    .settings svg { width: 16px; height: 16px; color: var(--muted, #9ba2ac); }
    .settings + .logout { margin-top: 8px; }
    .storage { display: grid; gap: 8px; margin-top: 12px; font-size: 12px; }
    .storage:empty { display: none; }
    .storage p { margin: 0; color: var(--muted, #9ba2ac); }
    .storage p.err { color: #f2c46d; }
    .storage input[type=email] { box-sizing: border-box; width: 100%; height: 32px; padding: 0 8px; border-radius: 8px;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); background: var(--bg, #0b0c0e); color: inherit; font: inherit; }
    .storage input[type=email]:focus-visible { outline: 2px solid var(--accent, #7ee0c3); outline-offset: 1px; }
    .storage textarea { box-sizing: border-box; width: 100%; min-height: 56px; padding: 6px 8px; border-radius: 8px; resize: vertical;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); background: var(--bg, #0b0c0e); color: inherit; font: inherit; }
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; height: 32px; padding: 0 10px; border-radius: 8px; cursor: pointer; background: transparent;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); }
    .btn:hover { background: var(--surface-2, #14171b); }
    .btn.primary { border-color: transparent; background: var(--accent, #7ee0c3); color: var(--accent-fg, #04110d); }
    .btn.primary:hover { opacity: .9; background: var(--accent, #7ee0c3); }
    .btn:disabled { opacity: .5; cursor: default; }
    .btn:focus-visible, .storage textarea:focus-visible { outline: 2px solid var(--accent, #7ee0c3); outline-offset: 1px; }
    .stars { display: flex; gap: 2px; }
    .stars button { width: 30px; height: 30px; padding: 0; border: 0; border-radius: 6px; background: transparent; cursor: pointer;
      font-size: 20px; line-height: 1; color: var(--border-strong, #2d3239); }
    .stars button.on { color: #f2c46d; }
    .stars button:focus-visible, .kinds button:focus-visible, .author:focus-visible { outline: 2px solid var(--accent, #7ee0c3); }
    .kinds { display: flex; gap: 4px; padding: 2px; border-radius: 8px; border: 1px solid var(--border, #1f2328); }
    .kinds button { flex: 1; height: 26px; border: 0; border-radius: 6px; background: transparent; cursor: pointer; color: var(--muted, #9ba2ac); }
    .kinds button[aria-pressed="true"] { background: var(--surface-2, #14171b); color: inherit; }
    dd.star { color: #f2c46d; }
    .author { display: block; margin-top: 10px; text-align: center; font-size: 12px; color: var(--muted, #9ba2ac); text-decoration: none; }
    .author:hover { color: var(--accent, #7ee0c3); text-decoration: underline; }
    .thanks { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 16px; background: #0009; }
    .thanks > div { box-sizing: border-box; width: min(340px, 100%); padding: 24px 20px 20px; border-radius: 14px; text-align: center;
      border: 1px solid var(--border-strong, var(--border, #2d3239)); background: var(--surface, #0f1114); box-shadow: 0 16px 40px #0008;
      animation: pop .18s ease-out; }
    .thanks .icon { font-size: 34px; line-height: 1; }
    .thanks h2 { margin: 10px 0 6px; font-size: 17px; }
    .thanks p { margin: 0 0 6px; color: var(--muted, #9ba2ac); font-size: 13px; }
    .thanks .btn { width: 100%; margin-top: 12px; height: 36px; }
    @keyframes pop { from { transform: scale(.94); opacity: 0; } }
    .btn.warn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 36px;
      /* Amber mixed with the text colour: light on dark themes, dark enough on light ones. */
      border-color: #e0a0207a; background: #e0a0201f; color: color-mix(in srgb, #e0a020 65%, var(--fg, var(--ink, #e7e9ec))); font-weight: 600; }
    .btn.warn:hover { background: #e0a02033; }
    .btn.warn svg { width: 16px; height: 16px; flex: none; }
    .reqbox { display: grid; gap: 8px; padding: 10px; border-radius: 10px; border: 1px solid var(--border, #1f2328); background: var(--surface-2, #14171b); }
    .reqbox p.hint { margin: -2px 0 0; font-size: 11px; color: var(--subtle, var(--muted, #8a919c)); }
    .check { display: grid; grid-template-columns: 16px 1fr; column-gap: 8px; align-items: start; color: inherit; font-weight: 500; }
    .check .tick { display: grid; place-items: center; width: 16px; height: 16px; margin-top: 1px; border-radius: 4px; font-size: 11px; line-height: 1;
      background: var(--accent, #7ee0c3); color: var(--accent-fg, #04110d); }
    .check small { grid-column: 2; font-weight: 400; font-size: 11px; color: var(--subtle, var(--muted, #8a919c)); }
    .warn-text { color: #f2c46d; }
    [hidden] { display: none !important; }
  `;

  class TdzAccount extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: "open" }).innerHTML = `<style>${CSS}</style>`;
      this.t = TEXT[this.getAttribute("lang") === "en" ? "en" : "vi"];
      this.load();
    }

    async load() {
      const identity = await getJson("/cdn-cgi/access/get-identity");
      let email = identity.body?.email;
      let name = identity.body?.name;
      const accountUrl = this.getAttribute("account-url");
      if (accountUrl) {
        this.account = (await getJson(accountUrl)).body;
        email = email || this.account?.email;
      }
      const meUrl = this.getAttribute("me-url");
      if (!email && meUrl) {
        const me = await getJson(meUrl);
        email = me.body?.email;
      }
      if (!email) return this.renderSignedOut();
      const feedbackUrl = this.getAttribute("feedback-url");
      if (feedbackUrl) this.rating = (await getJson(feedbackUrl)).body;
      if (accountUrl) {
        this.onRefresh = async () => {
          this.account = (await getJson(accountUrl)).body ?? this.account;
          this.renderStorage();
        };
        window.addEventListener("tdz-account:refresh", this.onRefresh);
      }

      const adminUrl = this.getAttribute("admin-url");
      const admin = adminUrl ? (await getJson(adminUrl)).status : null;
      this.renderSignedIn({ email, name, admin: admin === 200 ? true : admin === 403 ? false : null });
    }

    renderSignedOut() {
      const url = this.getAttribute("login-url");
      if (!url) return;
      const a = document.createElement("a");
      a.className = "login";
      a.textContent = this.t.signIn;
      // Come back to the current page after signing in.
      a.href = `${url}${url.includes("?") ? "&" : "?"}return=${encodeURIComponent(location.pathname + location.search)}`;
      this.shadowRoot.append(a);
    }

    renderSignedIn({ email, name, admin }) {
      const t = this.t;
      const root = this.shadowRoot;
      const letters = initials(name, email);

      const button = document.createElement("button");
      button.type = "button";
      button.className = `avatar${admin === false ? " warn" : ""}`;
      button.textContent = letters;
      button.setAttribute("aria-haspopup", "true");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", `${t.account}: ${email}`);

      const panel = document.createElement("div");
      panel.className = "panel";
      panel.hidden = true;
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", t.account);

      const who = document.createElement("div");
      who.className = "who";
      const big = document.createElement("span");
      big.className = "avatar";
      big.setAttribute("aria-hidden", "true");
      big.textContent = letters;
      const info = document.createElement("div");
      if (name) info.append(Object.assign(document.createElement("div"), { className: "name", textContent: name }));
      info.append(Object.assign(document.createElement("div"), { className: "email", textContent: email, title: email }));
      who.append(big, info);

      const dl = document.createElement("dl");
      const row = (k, v, cls = "") => {
        const d = document.createElement("div");
        d.append(Object.assign(document.createElement("dt"), { textContent: k }), Object.assign(document.createElement("dd"), { textContent: v, className: cls }));
        dl.append(d);
      };
      row(t.via, "Cloudflare Access");
      if (admin !== null) row(t.admin, admin ? t.yes : t.no, admin ? "yes" : "no");

      this.dl = dl;
      this.storageBox = Object.assign(document.createElement("div"), { className: "storage" });
      this.feedbackBox = Object.assign(document.createElement("div"), { className: "storage" });

      const logout = Object.assign(document.createElement("a"), { className: "logout", href: "/cdn-cgi/access/logout", textContent: t.signOut });
      panel.append(who, dl, this.storageBox, this.feedbackBox);
      root.append(button, panel);
      this.renderStorage();
      this.renderFeedback();

      const setOpen = (open) => {
        panel.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
      };
      if (this.getAttribute("account-url")) {
        // Deferred: the click that fired it would otherwise close the menu again (outside click).
        this.onRequestStorage = () => setTimeout(() => {
          if (!this.canAskStorage()) return;
          setOpen(true);
          if (this.getAttribute("feedback-url")) this.renderFeedbackForm({ storage: true });
          else this.renderRequestForm();
          this.scrollIntoView({ block: "nearest" });
        });
        window.addEventListener("tdz-account:request-storage", this.onRequestStorage);
      }
      if (this.hasAttribute("settings")) {
        const settings = Object.assign(document.createElement("button"), { type: "button", className: "settings" });
        // Static markup only (no data): a gear icon.
        settings.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';
        settings.append(t.settings);
        settings.addEventListener("click", () => {
          setOpen(false);
          window.dispatchEvent(new CustomEvent("tdz-account:settings"));
        });
        panel.append(settings);
      }
      panel.append(logout);
      const authorUrl = this.getAttribute("author-url") ?? AUTHOR_URL;
      if (authorUrl && /^https?:\/\//.test(authorUrl)) {
        panel.append(Object.assign(document.createElement("a"), {
          className: "author", href: authorUrl, target: "_blank", rel: "noopener noreferrer", textContent: `${t.author} ↗`,
        }));
      }
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(panel.hidden);
      });
      document.addEventListener("click", (e) => {
        if (!e.composedPath().includes(this)) setOpen(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) {
          setOpen(false);
          button.focus();
        }
      });
    }

    disconnectedCallback() {
      if (this.onRefresh) window.removeEventListener("tdz-account:refresh", this.onRefresh);
      if (this.onRequestStorage) window.removeEventListener("tdz-account:request-storage", this.onRequestStorage);
    }

    // "Data stored" line and the request form, from the account endpoint (shared apps only).
    renderStorage() {
      const t = this.t;
      const acc = this.account;
      this.storageRow?.remove();
      this.storageRow = null;
      this.storageBox?.replaceChildren();
      if (!this.storageBox || !acc?.storage || acc.access === "public") return;

      const mode = acc.storage === "cloud" ? "cloud" : acc.storage === "readonly" ? "readonly" : "local";
      const d = document.createElement("div");
      d.append(
        Object.assign(document.createElement("dt"), { textContent: t.storage }),
        Object.assign(document.createElement("dd"), { textContent: t[mode], className: mode === "cloud" ? "yes" : "no" }),
      );
      // Above the rating line, which may have been added first.
      this.dl.insertBefore(d, this.ratingRow ?? null);
      this.storageRow = d;
      if (mode === "cloud" || acc.access !== "shared") return;

      const note = (text, className = "") => this.storageBox.appendChild(Object.assign(document.createElement("p"), { textContent: text, className }));
      const status = acc.request?.status;
      if (status === "pending") note(t.pending);
      if (status === "rejected") note(t.rejected);

      const ask = Object.assign(document.createElement("button"), { type: "button", className: "btn warn" });
      // Static markup only (no data): a warning triangle.
      ask.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
      ask.append(t.request);
      // With the feedback form, the storage request is one of its requests (no separate note form).
      ask.addEventListener("click", () => (this.getAttribute("feedback-url") ? this.renderFeedbackForm({ storage: true }) : this.renderRequestForm()));
      this.storageBox.append(ask);
    }

    // Average rating line and the "Rate & feedback" button (feedback-url only).
    renderFeedback() {
      const t = this.t;
      if (!this.getAttribute("feedback-url")) return;
      const r = this.rating;
      this.ratingRow?.remove();
      const d = document.createElement("div");
      d.append(
        Object.assign(document.createElement("dt"), { textContent: t.rating }),
        Object.assign(document.createElement("dd"), { textContent: r?.count ? `★ ${r.average} (${r.count})` : t.noRating, className: r?.count ? "star" : "" }),
      );
      this.dl.append(d);
      this.ratingRow = d;

      const open = Object.assign(document.createElement("button"), { type: "button", className: "btn", textContent: t.feedback });
      open.addEventListener("click", () => this.renderFeedbackForm());
      this.feedbackBox.replaceChildren(open);
    }

    // Shared app and data not on the server: every request also asks for server storage (asking
    // again while one is pending is harmless, the API keeps the pending one).
    canAskStorage() {
      const acc = this.account;
      return !!this.getAttribute("account-url") && acc?.access === "shared" && !!acc.storage && acc.storage !== "cloud";
    }

    renderFeedbackForm({ storage = false } = {}) {
      const t = this.t;
      // 5 stars until the user picks otherwise (their own rating when they already rated).
      let stars = this.rating?.mine ?? 5;
      let kind = storage ? "request" : "message";

      const mine = this.rating?.mine;
      const label = Object.assign(document.createElement("p"), { textContent: mine ? `${t.yourRating} (${t.rated} ${mine} ${t.star})` : t.yourRating });
      const starRow = Object.assign(document.createElement("div"), { className: "stars" });
      starRow.setAttribute("role", "radiogroup");
      starRow.setAttribute("aria-label", t.yourRating);
      const starButtons = [1, 2, 3, 4, 5].map((n) => {
        const b = Object.assign(document.createElement("button"), { type: "button", textContent: "★" });
        b.setAttribute("role", "radio");
        b.setAttribute("aria-label", `${n} ${t.star}`);
        b.addEventListener("click", () => {
          stars = n;
          paint();
        });
        return b;
      });
      const paint = () => starButtons.forEach((b, i) => {
        b.classList.toggle("on", i < stars);
        b.setAttribute("aria-checked", String(i + 1 === stars));
      });
      starRow.append(...starButtons);
      paint();

      const kinds = Object.assign(document.createElement("div"), { className: "kinds" });
      const kindButtons = [["message", t.kindMessage], ["request", t.kindRequest]].map(([k, text]) => {
        const b = Object.assign(document.createElement("button"), { type: "button", textContent: text });
        b.setAttribute("aria-pressed", String(k === kind));
        b.addEventListener("click", () => {
          kind = k;
          kindButtons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          showRequestFields();
        });
        return b;
      });
      kinds.append(...kindButtons);

      // Request card. Server storage (POST <account-url>/request) always goes with a request while it
      // can be asked for, and the email whose data this account should share (an account link).
      const accountUrl = this.getAttribute("account-url");
      const storageRow = Object.assign(document.createElement("div"), { className: "check" });
      storageRow.append(Object.assign(document.createElement("span"), { className: "tick", textContent: "✓" }), t.askStorage, Object.assign(document.createElement("small"), { textContent: t.askStorageHint }));
      const sync = Object.assign(document.createElement("input"), { type: "email", maxLength: 254, placeholder: t.syncWith });
      sync.setAttribute("aria-label", t.syncWith);
      const syncHint = Object.assign(document.createElement("p"), { className: "hint", textContent: t.syncHint });
      const reqbox = Object.assign(document.createElement("div"), { className: "reqbox" });
      reqbox.append(storageRow, sync, syncHint);
      const showRequestFields = () => {
        const request = kind === "request";
        storageRow.hidden = !request || !this.canAskStorage();
        sync.hidden = syncHint.hidden = !request || !accountUrl;
        reqbox.hidden = storageRow.hidden && sync.hidden;
        // Stars belong to feedback, not to a request.
        label.hidden = starRow.hidden = request;
        box.placeholder = request ? t.requestText : t.feedbackText;
        send.textContent = request ? t.sendRequest : t.send;
      };

      const box = Object.assign(document.createElement("textarea"), { maxLength: 1000, placeholder: t.feedbackText });
      box.setAttribute("aria-label", t.feedbackText);
      const cancel = Object.assign(document.createElement("button"), { type: "button", className: "btn", textContent: t.cancel });
      const send = Object.assign(document.createElement("button"), { type: "button", className: "btn primary", textContent: t.send });
      const actions = Object.assign(document.createElement("div"), { className: "actions" });
      actions.append(cancel, send);
      const error = Object.assign(document.createElement("p"), { className: "err", hidden: true });
      showRequestFields();
      // Request first when it is what the user came for; the rating stays below, optional.
      this.feedbackBox.replaceChildren(kinds, reqbox, label, starRow, box, actions, error);
      if (storage) box.focus();

      cancel.addEventListener("click", () => {
        this.renderFeedback();
        this.renderStorage();
      });
      send.addEventListener("click", async () => {
        const message = box.value.trim();
        const primary = !sync.hidden ? sync.value.trim().toLowerCase() : "";
        const changed = kind !== "request" && stars > 0 && stars !== this.rating?.mine;
        const askStorage = !storageRow.hidden;
        const fail = (text) => {
          send.disabled = cancel.disabled = false;
          error.hidden = false;
          error.textContent = text;
        };
        // A request always says what it is for.
        if (kind === "request" && !message) {
          fail(t.noteRequired);
          return box.focus();
        }
        if (!changed && !message && !primary && !askStorage) return this.renderFeedback();
        if (primary && !sync.checkValidity()) return fail(t.badEmail);
        send.disabled = cancel.disabled = true;
        if (askStorage) {
          const req = await postJson(`${accountUrl}/request`, message ? { message } : {});
          if (req.status !== 200 && req.status !== 201) {
            return fail(req.body?.error?.code === "request_cooldown" ? t.cooldown : t.failed);
          }
          const request = { status: "pending", message: message || null, requestedAt: new Date().toISOString(), decidedAt: null };
          this.account = { ...this.account, request };
          this.renderStorage();
          window.dispatchEvent(new CustomEvent("tdz-account:change", { detail: this.account }));
        }
        if (primary) {
          const link = await postJson(`${accountUrl}/link`, message ? { primary, message } : { primary });
          if (link.status !== 200 && link.status !== 201) {
            const code = link.body?.error?.code;
            return fail(code === "already_linked" ? t.linked : code === "request_cooldown" ? t.cooldown
              : code === "invalid_link" || link.status === 400 ? t.linkInvalid : t.failed);
          }
          window.dispatchEvent(new CustomEvent("tdz-account:refresh"));
        }
        // The message already went with the storage / link request (and its Telegram notice).
        const feedbackMessage = askStorage || primary ? "" : message;
        if (!changed && !feedbackMessage) {
          this.renderFeedback();
          return this.showThanks({ kind, message, primary, storage: askStorage });
        }
        const res = await postJson(this.getAttribute("feedback-url"), {
          ...(changed ? { stars } : {}),
          ...(feedbackMessage ? { kind, message: feedbackMessage } : {}),
        });
        if (res.status === 201) {
          this.rating = res.body;
          this.renderFeedback();
          return this.showThanks({ stars: changed ? stars : 0, kind, message, primary, storage: askStorage });
        }
        fail(res.body?.error?.code === "feedback_limit" ? t.limit : t.failed);
      });
    }

    // Thank-you popup after a rating / message / request; closes the menu behind it.
    showThanks({ stars = 0, kind, message = "", primary = "", storage = false }) {
      const t = this.t;
      this.shadowRoot.querySelector(".panel")?.setAttribute("hidden", "");
      this.shadowRoot.querySelector("button.avatar")?.setAttribute("aria-expanded", "false");
      const lines = [];
      if (message && !storage && !primary) lines.push(kind === "request" ? t.thanksRequest : t.thanksMessage);
      if (storage) lines.push(t.thanksStorage);
      if (primary) lines.push(t.thanksSync.replace("{email}", primary));
      if (stars) lines.push(`${"★".repeat(stars)}${"☆".repeat(5 - stars)} · ${t.thanksRating}`);

      const overlay = Object.assign(document.createElement("div"), { className: "thanks" });
      const card = document.createElement("div");
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");
      card.setAttribute("aria-label", t.thanksTitle);
      card.append(
        Object.assign(document.createElement("div"), { className: "icon", textContent: kind === "request" && message ? "🙌" : "💛" }),
        Object.assign(document.createElement("h2"), { textContent: t.thanksTitle }),
        ...lines.map((textContent) => Object.assign(document.createElement("p"), { textContent })),
      );
      const close = Object.assign(document.createElement("button"), { type: "button", className: "btn primary", textContent: t.close });
      card.append(close);
      overlay.append(card);
      const done = () => {
        host.remove();
        document.removeEventListener("keydown", onKey, true);
      };
      const onKey = (e) => {
        if (e.key === "Escape") done();
      };
      close.addEventListener("click", done);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) done();
      });
      document.addEventListener("keydown", onKey, true);
      // On <body> (own shadow root): a blurred/transformed header would trap position: fixed.
      const host = document.createElement("div");
      host.attachShadow({ mode: "open" }).innerHTML = `<style>${CSS}</style>`;
      host.shadowRoot.append(overlay);
      document.body.append(host);
      close.focus();
    }

    renderRequestForm() {
      const t = this.t;
      const box = Object.assign(document.createElement("textarea"), { maxLength: 500, placeholder: t.message });
      box.setAttribute("aria-label", t.message);
      const cancel = Object.assign(document.createElement("button"), { type: "button", className: "btn", textContent: t.cancel });
      const send = Object.assign(document.createElement("button"), { type: "button", className: "btn primary", textContent: t.send });
      const actions = Object.assign(document.createElement("div"), { className: "actions" });
      actions.append(cancel, send);
      const error = Object.assign(document.createElement("p"), { className: "err", hidden: true });
      this.storageBox.replaceChildren(box, actions, error);
      box.focus();

      cancel.addEventListener("click", () => this.renderStorage());
      send.addEventListener("click", async () => {
        send.disabled = cancel.disabled = true;
        const message = box.value.trim();
        const res = await postJson(`${this.getAttribute("account-url")}/request`, message ? { message } : {});
        if (res.status === 200 || res.status === 201) {
          const request = { status: "pending", message: message || null, requestedAt: new Date().toISOString(), decidedAt: null };
          this.account = { ...this.account, request };
          this.renderStorage();
          window.dispatchEvent(new CustomEvent("tdz-account:change", { detail: this.account }));
          return;
        }
        send.disabled = cancel.disabled = false;
        error.hidden = false;
        error.textContent = res.body?.error?.code === "request_cooldown" ? t.cooldown : t.failed;
      });
    }
  }

  customElements.define("tdz-account", TdzAccount);
})();
