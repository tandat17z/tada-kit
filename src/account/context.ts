import { createContext, useContext } from 'react'
import type { AccountState } from './types'

export const AccountContext = createContext<AccountState>({ account: null, refresh: () => {} })
export const useAccount = () => useContext(AccountContext)

/** Fired by the account menu (<tdz-account>) after it sent a storage request itself. */
export const ACCOUNT_CHANGED_EVENT = 'tdz-account:change'

/** Tells the account menu to re-read the account (e.g. after the page sent a request). */
export const refreshAccountMenu = () => window.dispatchEvent(new Event('tdz-account:refresh'))

/** Opens the account menu on its server-storage request form (the page's own "ask" button). */
export const openStorageRequest = () => window.dispatchEvent(new Event('tdz-account:request-storage'))
