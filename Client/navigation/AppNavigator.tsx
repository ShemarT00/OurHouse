/**
 * App Navigator
 * Handles navigation for authenticated users
 * Contains tab navigation and nested stack flows for lists and items
 */

import React from "react";
import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export const AppNavigator = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="member-invites"
        options={{
          title: "Invites",
          tabBarLabel: "Invites",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "mail" : "mail-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

/**
 * Household Stack Navigator
 * Nested stack for household-specific operations
 */
export const HouseholdStackNavigator = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen
        name="household-[OHID]"
        options={{
          headerTitle: "Household",
        }}
      />
      <Stack.Screen
        name="list-detail-[OHID]"
        options={{
          headerTitle: "List Details",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="add-item-[OHID]"
        options={{
          headerTitle: "Add Item",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="edit-item-[OHID]"
        options={{
          headerTitle: "Edit Item",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="household-members-[OHID]"
        options={{
          headerTitle: "Household Members",
        }}
      />
    </Stack>
  );
};
