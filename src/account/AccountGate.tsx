import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ACCOUNT_CHANGED_EVENT, AccountContext, refreshAccountMenu } from './context'
import type { Account } from './types'

type State = { loading: true } | { loading: false; account: Account | null }

const RECHECK_MS = 15_000

export interface AccountGateProps<S> {
  /** `GET /v1/<app>/account` through the app's API client. */
  fetchAccount: () => Promise<Account>
  /** Grant revoked: copy the read-only server data into this browser once (errors are ignored). */
  onReadonly?: (account: Account) => Promise<unknown>
  /** The app's data store for where data lives; memoised per (onServer, email). */
  storeFor: (onServer: boolean, email: string) => S
  /** Puts the store in place for the subtree. `key` changes with the store, to remount views on a switch. */
  provide: (store: S, children: ReactNode, key: string) => ReactNode
  children: ReactNode
}

/**
 * Reads the account once, then picks where data lives: the server (owner / approved) or this
 * browser (everyone else). The app renders only after that, so it never flashes a 403.
 * The account is read again when the tab or window comes back, so an approval shows up without a reload.
 */
export function AccountGate<S>({ fetchAccount, onReadonly, storeFor, provide, children }: AccountGateProps<S>) {
  const [state, setState] = useState<State>({ loading: true })
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let alive = true
    fetchAccount().then(
      async (account) => {
        if (account.storage === 'readonly' && onReadonly) await onReadonly(account).catch(() => false)
        if (alive) setState({ loading: false, account })
      },
      // Older API, signed out or offline: behave as before (server; its errors are shown by the views).
      // A failed re-check keeps what is already known, so a local user never lands on the server.
      () => alive && setState((s) => (s.loading ? { loading: false, account: null } : s)),
    )
    return () => {
      alive = false
    }
    // fetchAccount / onReadonly are module-level functions in the apps; only `version` re-reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  useEffect(() => {
    // Coming back to the tab or the window: re-check, at most every RECHECK_MS.
    let last = Date.now()
    const onReturn = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < RECHECK_MS) return
      last = Date.now()
      refresh()
      refreshAccountMenu()
    }
    window.addEventListener(ACCOUNT_CHANGED_EVENT, refresh)
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('focus', onReturn)
    return () => {
      window.removeEventListener(ACCOUNT_CHANGED_EVENT, refresh)
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('focus', onReturn)
    }
  }, [refresh])

  const account = state.loading ? null : state.account
  const email = account?.email ?? ''
  const onServer = !account || account.storage === 'cloud'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => storeFor(onServer, email), [onServer, email])
  const accountState = useMemo(() => ({ account, refresh }), [account, refresh])

  if (state.loading) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <span className="h-6 w-12 animate-pulse rounded-md bg-accent/15" />
      </div>
    )
  }

  return <AccountContext value={accountState}>{provide(store, children, onServer ? 'server' : `browser:${email}`)}</AccountContext>
}
