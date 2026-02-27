/**
 * Authentication Navigator
 * Handles login, signup, and password reset flows
 * Used for unauthenticated users
 */

import React from "react";
import { Stack } from "expo-router";

export const AuthNavigator = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: "#fff" },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
          animationTypeForReplace: true,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: "Sign Up",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Forgot Password",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: "Reset Password",
          presentation: "modal",
        }}
      />
    </Stack>
  );
};
