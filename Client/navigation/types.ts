/**
 * Navigation type definitions for OurHouse
 * Ensures type safety across all navigation flows
 */

export type RootStackParamList = {
  "(auth)": undefined;
  "(app)": undefined;
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  "forgot-password": undefined;
  "reset-password": { token: string; email: string };
};

export type AppStackParamList = {
  home: undefined;
  "household-[OHID]": {
    OHID: string;
  };
  "list-[OHID]": {
    OHID: string;
    householdId: string;
  };
  "list-detail-[OHID]": {
    OHID: string;
    householdId: string;
  };
  "add-item-[OHID]": {
    listId: string;
    householdId: string;
  };
  "edit-item-[OHID]": {
    itemId: string;
    listId: string;
    householdId: string;
  };
  "household-members-[OHID]": {
    householdId: string;
  };
  profile: undefined;
  settings: undefined;
  "member-invites": undefined;
};

export type TabParamList = {
  home: undefined;
  profile: undefined;
  settings: undefined;
};

export type NavigationRootParamList = RootStackParamList &
  AuthStackParamList &
  AppStackParamList;
