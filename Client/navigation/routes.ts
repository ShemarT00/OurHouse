/**
 * Routes to the household screens, which hold a household's shopping lists and
 * their items in one stack (app/(app)/household/). Use these rather than writing
 * the paths out, so they stay in step with the route files.
 */

type Id = string | number;

export const NEW_HOUSEHOLD = '/(app)/household/create';
export const JOIN_HOUSEHOLD = '/(app)/household/join';

export const householdRoute = (householdId: Id) =>
  ({ pathname: '/(app)/household/[householdId]', params: { householdId } }) as const;

export const membersRoute = (householdId: Id) =>
  ({ pathname: '/(app)/household/[householdId]/members', params: { householdId } }) as const;

export const storesRoute = (householdId: Id) =>
  ({ pathname: '/(app)/household/[householdId]/stores', params: { householdId } }) as const;

export const newListRoute = (householdId: Id) =>
  ({ pathname: '/(app)/household/[householdId]/list/create', params: { householdId } }) as const;

export const listRoute = (householdId: Id, listId: Id) =>
  ({ pathname: '/(app)/household/[householdId]/list/[listId]', params: { householdId, listId } }) as const;

export const newItemRoute = (householdId: Id, listId: Id) =>
  ({ pathname: '/(app)/household/[householdId]/list/[listId]/item/create', params: { householdId, listId } }) as const;

export const itemRoute = (householdId: Id, listId: Id, itemId: Id) =>
  ({
    pathname: '/(app)/household/[householdId]/list/[listId]/item/[itemId]',
    params: { householdId, listId, itemId },
  }) as const;

/** Where the Menu's shortcuts choose a household (and, for an item, a list) for the new list or item */
export const pickRoute = (next: 'list' | 'item') =>
  ({ pathname: '/(app)/household/pick', params: { next } }) as const;

/**
 * Pass when opening a household screen from outside them (Home, Notifications, the Menu),
 * so the household stack's first screen, which goes Home, lies beneath. Back from a
 * household then goes Home, and a list or item opens with its household (and list)
 * beneath it. See app/(app)/household/_layout.tsx.
 */
export const FROM_OUTSIDE_HOUSEHOLD = { withAnchor: true } as const;
