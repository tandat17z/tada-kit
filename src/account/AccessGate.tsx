'use client'

import { type ReactNode, useEffect, useState } from 'react'

export interface AccessGateProps {
  /**
   * Asks the API whether the signed-in user may see this site and resolves to the HTTP status,
   * e.g. `() => fetch(url, { credentials: 'include' }).then((r) => r.status)`.
   * 403 hides everything; any other answer (or a failed request) shows the page, whose own API
   * calls then report their errors.
   */
  check: () => Promise<number>
  children: ReactNode
}

/**
 * Private site or app: shows nothing at all to a signed-in user without access (the API says 403),
 * not even an error, and nothing while it checks, so the content never flashes. The API still
 * enforces access on its own; this only keeps the page empty for people who are not allowed in.
 */
export function AccessGate({ check, children }: AccessGateProps) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let alive = true
    check().then(
      (status) => alive && setState(status === 403 ? 'denied' : 'allowed'),
      () => alive && setState('allowed'),
    )
    return () => {
      alive = false
    }
    // `check` is a module-level function in the apps; it runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state === 'allowed' ? children : null
}
