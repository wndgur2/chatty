import type { AuthPrincipal } from '../types/auth-principal.type';
import { isGuestPrincipal, isUserPrincipal } from '../types/auth-principal.type';

export type OwnerScope =
  | { kind: 'user'; userId: bigint }
  | { kind: 'guest'; guestSessionId: string };

export function ownerScopeFromPrincipal(principal: AuthPrincipal): OwnerScope {
  if (isUserPrincipal(principal)) {
    return { kind: 'user', userId: BigInt(principal.userId) };
  }
  if (isGuestPrincipal(principal)) {
    return { kind: 'guest', guestSessionId: principal.guestSessionId };
  }
  const _exhaustive: never = principal;
  return _exhaustive;
}
