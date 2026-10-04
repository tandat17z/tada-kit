# layout module

The page shell every app shares, so a new app starts with the same header and the same width.
Import from `@tada/kit/layout`.

```tsx
import { AppBrand } from '@tada/kit/brand'
import { AppHeader, AppMain, headerTabClass } from '@tada/kit/layout'

<AppHeader
  brand={<><AppBrand name="MySite" shortName="MySiii" changelog={changelog} locale={locale} /><Badge /></>}
  navProps={{ role: 'tablist', 'aria-label': 'Views' }}
  nav={tabs.map((t) => <button key={t.id} role="tab" className={headerTabClass(view === t.id)}>…</button>)}
  actions={<PeriodBar />}                      // optional page controls
  account={<><SettingsLauncher /><tdz-account … /></>}
/>
<AppMain>…</AppMain>
```

- `AppHeader`: sticky; phone / tablet = brand row + tab row, `lg` = one row, `xl` = tabs centred. It also pads for the iOS notch.
- `AppMain`: same width as the header (`max-w-screen-2xl`). `className` replaces the bottom padding (e.g. `pb-32` above a fixed bar).
- `headerTabClass(active)`: one tab; in a `<Link>`/`NavLink` pass `active` yourself.
