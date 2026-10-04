import { THEMES, type Theme } from './theme'

const LABELS: Record<string, { group: string; dark: string; light: string }> = {
  en: { group: 'Appearance', dark: 'Dark', light: 'Light' },
  vi: { group: 'Giao diện', dark: 'Tối', light: 'Sáng' },
}

export interface ThemePickerProps {
  value: Theme
  onChange: (theme: Theme) => void
  /** `en` / `vi` (default `en`) for the built-in labels. */
  locale?: string
  /** Override any built-in label. */
  labels?: Partial<{ group: string; dark: string; light: string }>
  /** Hide the group heading when the host already shows one. */
  hideHeading?: boolean
}

/** Dark / light choice as two cards (radio group). Self-contained: React + Tailwind with the shared tokens. */
export function ThemePicker({ value, onChange, locale = 'en', labels, hideHeading }: ThemePickerProps) {
  const l = { ...(LABELS[locale] ?? LABELS.en), ...labels }
  return (
    <section className="grid gap-3">
      {!hideHeading && <h3 className="font-mono text-[11px] tracking-wider text-subtle uppercase">{l.group}</h3>}
      <div role="radiogroup" aria-label={l.group} className="grid grid-cols-2 gap-2">
        {THEMES.map((th) => (
          <button
            key={th}
            type="button"
            role="radio"
            aria-checked={value === th}
            onClick={() => onChange(th)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors ${value === th ? 'border-accent bg-accent/10' : 'border-border hover:border-border-strong'}`}
          >
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-base">
              {th === 'dark' ? '☾' : '☀'}
            </span>
            {l[th]}
          </button>
        ))}
      </div>
    </section>
  )
}
