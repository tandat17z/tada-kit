import type { HTMLAttributes, ReactNode } from 'react'

// Literal class names so Tailwind can see them. One page width for every app (not per app).
const WIDTH = 'max-w-screen-2xl'

export interface AppHeaderProps {
  /** Logo + name + version (`AppBrand`) and any badge next to it. */
  brand: ReactNode
  /** Tabs, as direct children of one row (see `headerTabClass`). */
  nav: ReactNode
  /** Props of the tab row's element, e.g. `role`, `aria-label`. */
  navProps?: HTMLAttributes<HTMLDivElement>
  /** Page-specific controls on the right (period picker…), before the account. */
  actions?: ReactNode
  /** Extra classes for the `actions` row. */
  actionsClassName?: string
  /** Settings button, account menu: the right-most group (labels collapse on a phone). */
  account?: ReactNode
}

/**
 * The slim sticky header every app shares. Phone / tablet: row 1 = brand + controls + account,
 * row 2 = tabs. `lg`: a single row. `xl`: tabs centred on the page. Pair it with `AppMain`.
 */
export function AppHeader({ brand, nav, navProps, actions, actionsClassName = '', account }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className={`mx-auto flex ${WIDTH} flex-wrap items-center gap-x-3 gap-y-0 px-4 pt-1.5 sm:px-6 lg:flex-nowrap lg:gap-x-4 lg:pt-0 xl:grid xl:grid-cols-[1fr_auto_1fr]`}>
        <div className="order-1 flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-3 lg:py-2">{brand}</div>
        <div {...navProps} className="order-3 flex w-full justify-center sm:gap-1 lg:order-2 lg:mx-auto lg:w-auto xl:justify-self-center">
          {nav}
        </div>
        <div className={`order-2 ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3 lg:order-3 lg:py-2 xl:justify-self-end ${actionsClassName}`}>
          {actions}
          {account && <div className="flex shrink-0 items-center gap-2 max-sm:[&_summary>span:last-of-type]:hidden max-sm:[&_summary>svg]:hidden sm:gap-3">{account}</div>}
        </div>
      </div>
    </header>
  )
}

/** Class of one tab inside `AppHeader`'s `nav` (a button or a link). */
export const headerTabClass = (active: boolean, extra = '') =>
  `flex-1 border-b-2 px-2 py-1.5 text-center text-sm font-medium whitespace-nowrap transition-colors sm:px-5 lg:flex-none lg:px-3.5 lg:py-[1.125rem] xl:px-5 ${active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg'} ${extra}`

export interface AppMainProps {
  children: ReactNode
  /** Extra classes, e.g. bottom padding for a fixed bar. */
  className?: string
}

/** Page body: same width as `AppHeader`, one column that may shrink (`minmax(0,1fr)`), even gaps. */
export function AppMain({ children, className = '' }: AppMainProps) {
  return <main className={`mx-auto grid ${WIDTH} grid-cols-[minmax(0,1fr)] gap-5 px-4 pt-4 sm:px-6 sm:pt-6 ${className || 'pb-4 sm:pb-6'}`}>{children}</main>
}
