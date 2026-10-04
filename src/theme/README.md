# theme module

Dark / light for every app. The colours are in `@tada/kit/tokens.css` (dark by default, light under
`:root[data-theme='light']`); this module switches them and gives the picker. Import from `@tada/kit/theme`.

```tsx
import { applyTheme, ThemePicker, type Theme } from '@tada/kit/theme'

applyTheme(settings.theme)            // on load, and whenever it changes
<ThemePicker value={settings.theme} onChange={(theme) => save(theme)} locale={locale} />
```

- `applyTheme(theme)` sets `data-theme` on `<html>` and the `theme-color` meta (browser toolbar).
- Keeping the choice is the app's job (a setting in the browser, synced to the server when data lives there).
- To avoid a flash of the wrong theme, call `applyTheme` as early as possible (module load, before render).
- `ThemePicker`: two cards (radio group); `locale` `en` / `vi`, `labels` to override, `hideHeading` when the host has a heading.
- App-specific colours (e.g. a warning orange) override their light value with their own `:root[data-theme='light']` rule.
