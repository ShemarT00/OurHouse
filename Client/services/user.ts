/**
 * User API Service
 * Handles user profile operations
 */

import { apiGet, apiPut, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import type { ItemEvent, User } from "@/types";

export interface UpdateUserProfile {
  name: string;
}

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  return apiGet<User>(API_ENDPOINTS.USERS.PROFILE);
};

/**
 * Get user by OHID
 */
export const getUser = async (OHID: string): Promise<ApiResponse<User>> => {
  return apiGet<User>(API_ENDPOINTS.USERS.GET_USER(OHID));
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (
  data: UpdateUserProfile
): Promise<ApiResponse<User>> => {
  return apiPut<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
};

/**
 * Replace the account's Switched-off Events; returns the updated profile
 */
export const setSwitchedOffEvents = async (
  switchedOffEvents: ItemEvent[]
): Promise<ApiResponse<User>> => {
  return apiPut<User>(API_ENDPOINTS.USERS.SWITCHED_OFF_EVENTS, { switchedOffEvents });
};
