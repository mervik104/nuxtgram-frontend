// Canonical form is shared by the input validator and every DB lookup.
export const RESERVED_NICKNAMES = new Set([
  'admin', 'administrator', 'api', 'auth', 'help', 'login', 'logout',
  'moderator', 'root', 'settings', 'support', 'system', 'user',
])

export function normalizeNickname(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

export function isReservedNickname(value: string): boolean {
  return RESERVED_NICKNAMES.has(normalizeNickname(value))
}
