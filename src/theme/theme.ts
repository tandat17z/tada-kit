export type Theme = 'dark' | 'light'

export const THEMES: readonly Theme[] = ['dark', 'light']

export const isTheme = (v: unknown): v is Theme => v === 'dark' || v === 'light'

/** Page background per theme, for the browser UI (`theme-color`). Matches `--bg` in tokens.css. */
const BAR: Record<Theme, string> = { dark: '#08090b', light: '#f4f5f7' }

/**
 * Switches the whole app: `data-theme` on `<html>` selects the token set in `@tada/kit/tokens.css`
 * (dark is the default without it), and the browser's toolbar colour follows. Call it on load and
 * whenever the choice changes; keeping the choice (browser, server) is the app's job.
 */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme])
}
