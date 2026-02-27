/**
 * Custom navigation hooks
 * Provides type-safe navigation utilities
 */

import { useRouter } from "expo-router";
import { useCallback } from "react";
import { AppRoutes, AuthRoutes } from "../routes";

/**
 * Hook for navigating to auth routes
 */
export const useAuthNavigation = () => {
  const router = useRouter();

  return {
    goToLogin: useCallback(() => router.push(AuthRoutes.LOGIN), [router]),
    goToSignup: useCallback(() => router.push(AuthRoutes.SIGNUP), [router]),
    goToForgotPassword: useCallback(
      () => router.push(AuthRoutes.FORGOT_PASSWORD),
      [router]
    ),
    goToResetPassword: useCallback(
      (token: string, email: string) =>
        router.push(AuthRoutes.RESET_PASSWORD(token, email)),
      [router]
    ),
  };
};

/**
 * Hook for navigating to app routes
 */
export const useAppNavigation = () => {
  const router = useRouter();

  return {
    goHome: useCallback(() => router.push(AppRoutes.HOME), [router]),
    goToHousehold: useCallback(
      (householdId: string) =>
        router.push(AppRoutes.HOUSEHOLD(householdId)),
      [router]
    ),
    goToList: useCallback(
      (listId: string, householdId: string) =>
        router.push(AppRoutes.LIST(listId, householdId)),
      [router]
    ),
    goToListDetail: useCallback(
      (listId: string, householdId: string) =>
        router.push(AppRoutes.LIST_DETAIL(listId, householdId)),
      [router]
    ),
    goToAddItem: useCallback(
      (listId: string, householdId: string) =>
        router.push(AppRoutes.ADD_ITEM(listId, householdId)),
      [router]
    ),
    goToEditItem: useCallback(
      (itemId: string, listId: string, householdId: string) =>
        router.push(AppRoutes.EDIT_ITEM(itemId, listId, householdId)),
      [router]
    ),
    goToHouseholdMembers: useCallback(
      (householdId: string) =>
        router.push(AppRoutes.HOUSEHOLD_MEMBERS(householdId)),
      [router]
    ),
    goToProfile: useCallback(() => router.push(AppRoutes.PROFILE), [router]),
    goToSettings: useCallback(() => router.push(AppRoutes.SETTINGS), [router]),
    goToMemberInvites: useCallback(
      () => router.push(AppRoutes.MEMBER_INVITES),
      [router]
    ),
  };
};

/**
 * Hook combining both auth and app navigation
 */
export const useNavigation = () => {
  const router = useRouter();
  const authNav = useAuthNavigation();
  const appNav = useAppNavigation();

  return {
    ...authNav,
    ...appNav,
    goBack: useCallback(() => router.back(), [router]),
    replace: useCallback((route: string) => router.replace(route), [router]),
    push: useCallback((route: string) => router.push(route), [router]),
  };
};
