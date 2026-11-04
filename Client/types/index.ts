// Domain types are generated from the server models (Server/schema).
// Re-run `python Server/scripts/gen_client_types.py` after changing them.
export * from './generated';

import type { Household, Member } from './generated';

/** A household as the signed-in account sees it: with whether its own membership is muted */
export type MemberHousehold = Household & Pick<Member, 'muted'>;

/** A member as the rest of their household sees them: whether they have muted it is theirs alone */
export type HouseholdMember = Omit<Member, 'muted'>;

/** Response to muting or unmuting a household */
export interface HouseholdMuted {
  householdId: number;
  muted: boolean;
}
