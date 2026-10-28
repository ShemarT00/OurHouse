/**
 * Supabase and API Configuration
 * Central configuration for all API clients
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase configuration missing. Check environment variables."
  );
}

/**
 * Supabase client for real-time and database operations
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * API configuration object
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
} as const;

/**
 * API endpoints mapping
 */
export const API_ENDPOINTS = {
  // Users
  USERS: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    GET_USER: (OHID: string) => `/users/${OHID}`,
  },

  // Households
  HOUSEHOLDS: {
    LIST: "/households",
    CREATE: "/households",
    JOIN: "/households/join",
    GET: (OHID: string) => `/households/${OHID}`,
    UPDATE: (OHID: string) => `/households/${OHID}`,
    DELETE: (OHID: string) => `/households/${OHID}`,
  },

  // Members
  MEMBERS: {
    LIST: (householdId: string) => `/households/${householdId}/members`,
    GET: (householdId: string, OHID: string) =>
      `/households/${householdId}/members/${OHID}`,
    ADD: (householdId: string) => `/households/${householdId}/members`,
    REMOVE: (householdId: string, OHID: string) =>
      `/households/${householdId}/members/${OHID}`,
  },

  // Shopping Lists
  LISTS: {
    LIST: (householdId: string) =>
      `/households/${householdId}/shopping-lists`,
    CREATE: (householdId: string) =>
      `/households/${householdId}/shopping-lists`,
    GET: (householdId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${OHID}`,
    UPDATE: (householdId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${OHID}`,
    DELETE: (householdId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${OHID}`,
  },

  // Items
  ITEMS: {
    LIST: (householdId: string, listId: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items`,
    CREATE: (householdId: string, listId: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items`,
    GET: (householdId: string, listId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items/${OHID}`,
    UPDATE: (householdId: string, listId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items/${OHID}`,
    DELETE: (householdId: string, listId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items/${OHID}`,
    TOGGLE_COMPLETE: (householdId: string, listId: string, OHID: string) =>
      `/households/${householdId}/shopping-lists/${listId}/items/${OHID}/toggle`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/notifications",
    GET: (OHID: string) => `/notifications/${OHID}`,
    MARK_READ: (OHID: string) => `/notifications/${OHID}/mark-read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
    DELETE: (OHID: string) => `/notifications/${OHID}`,
  },

  // Stores
  STORES: {
    LIST: (householdId: string) => `/households/${householdId}/stores`,
    CREATE: (householdId: string) => `/households/${householdId}/stores`,
  },
} as const;
