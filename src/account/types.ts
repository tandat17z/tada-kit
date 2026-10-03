// The caller's account in an app of the central API (`GET /v1/<app>/account`): who they are and
// where their data lives. The API decides; apps only follow it.

/** cloud = data on the server · readonly = grant revoked, server data can only be read · local = this browser only. */
export type StorageMode = 'cloud' | 'readonly' | 'local'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'revoked'

export interface Account {
  email: string
  role: 'owner' | 'user'
  access: 'private' | 'shared' | 'public'
  storage: StorageMode
  request: { status: RequestStatus; message: string | null; requestedAt: string; decidedAt: string | null } | null
}

export interface AccountState {
  /** Null when the API could not tell (older API, signed out, network): the app then uses the server as before. */
  account: Account | null
  /** Re-reads the account (after a request, or when the owner may have decided). */
  refresh: () => void
}
