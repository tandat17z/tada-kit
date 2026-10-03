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
      }
    }
  }
}
