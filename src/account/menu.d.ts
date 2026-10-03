import type { DetailedHTMLProps, HTMLAttributes } from 'react'

// Importing "@tada/kit/account-menu" defines <tdz-account> and gives it these JSX types.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'tdz-account': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        lang?: 'vi' | 'en'
        'login-url'?: string
        'admin-url'?: string
        'me-url'?: string
        'account-url'?: string
        /** Central-API /v1/<app>/feedback endpoint: average rating + rate & feedback form. */
        'feedback-url'?: string
        /** Language switch in the menu: "code=url;code=url", or "vi;en" + a "tdz-account:language" listener. */
        languages?: string
        /** Author site at the bottom of the menu (defaults to the kit's; "" hides it). */
        'author-url'?: string
        /** Adds a Settings item that fires "tdz-account:settings" on window. */
        settings?: boolean | ''
      }
    }
  }
}
