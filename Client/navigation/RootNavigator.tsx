/**
 * Root Navigator
 * Top-level navigation logic that switches between auth and app flows
 * based on authentication state from Zustand store
 */

import React, { useEffect } from "react";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { DeepLinkingConfig } from "./routes";

interface RootNavigatorProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const RootNavigator = ({
  isAuthenticated,
  isLoading,
}: RootNavigatorProps) => {
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    if (isLoading) return;

    if (!isAuthenticated && navigationState.key) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && navigationState.key) {
      router.replace("/(app)/home");
    }
  }, [isAuthenticated, isLoading, navigationState?.key, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
      linking={DeepLinkingConfig}
    >
      <Stack.Screen
        name="(auth)"
        options={{
          animationTypeForReplace: true,
        }}
      />
      <Stack.Screen
        name="(app)"
        options={{
          animationTypeForReplace: true,
        }}
      />
    </Stack>
  );
};
