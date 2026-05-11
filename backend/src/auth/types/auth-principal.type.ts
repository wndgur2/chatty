export type AuthPrincipal =
  | { mode: 'user'; userId: string }
  | { mode: 'guest'; guestSessionId: string };

export function isUserPrincipal(
  principal: AuthPrincipal,
): principal is Extract<AuthPrincipal, { mode: 'user' }> {
  return principal.mode === 'user';
}

export function isGuestPrincipal(
  principal: AuthPrincipal,
): principal is Extract<AuthPrincipal, { mode: 'guest' }> {
  return principal.mode === 'guest';
}
