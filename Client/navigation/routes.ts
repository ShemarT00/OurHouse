/**
 * Route definitions and navigation paths
 * Centralized configuration for all app routes
 */

export const AuthRoutes = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: (token: string, email: string) =>
    `/reset-password?token=${token}&email=${email}`,
} as const;

export const AppRoutes = {
  HOME: "/home",
  HOUSEHOLD: (householdId: string) => `/household-${householdId}`,
  LIST: (listId: string, householdId: string) =>
    `/list-${listId}?householdId=${householdId}`,
  LIST_DETAIL: (listId: string, householdId: string) =>
    `/list-detail-${listId}?householdId=${householdId}`,
  ADD_ITEM: (listId: string, householdId: string) =>
    `/add-item-${listId}?householdId=${householdId}`,
  EDIT_ITEM: (itemId: string, listId: string, householdId: string) =>
    `/edit-item-${itemId}?listId=${listId}&householdId=${householdId}`,
  HOUSEHOLD_MEMBERS: (householdId: string) =>
    `/household-members-${householdId}`,
  PROFILE: "/profile",
  SETTINGS: "/settings",
  MEMBER_INVITES: "/member-invites",
} as const;

/**
 * Deep linking configuration
 * Maps external URIs to app routes
 */
export const DeepLinkingConfig = {
  prefixes: ["ourhouse://", "https://ourhouse.app"],
  config: {
    screens: {
      "(auth)": {
        login: "login",
        signup: "signup",
        "forgot-password": "forgot-password",
        "reset-password": "reset-password/:token/:email",
      },
      "(app)": {
        home: "home",
        "household-[OHID]": "household/:OHID",
        "list-[OHID]": "list/:OHID",
        "list-detail-[OHID]": "list-detail/:OHID",
        "add-item-[OHID]": "add-item/:OHID",
        "edit-item-[OHID]": "edit-item/:OHID",
        "household-members-[OHID]": "household-members/:OHID",
        profile: "profile",
        settings: "settings",
        "member-invites": "invites",
      },
      "*": "*",
    },
  },
} as const;
