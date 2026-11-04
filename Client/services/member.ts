/**
 * Member API Service
 * Handles household member management and access control
 */

import { apiGet, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import type { HouseholdMember } from "@/types";

/**
 * Get all members of a household
 */
export const getHouseholdMembers = async (
  householdId: string
): Promise<ApiResponse<HouseholdMember[]>> => {
  return apiGet<HouseholdMember[]>(API_ENDPOINTS.MEMBERS.LIST(householdId));
};

/**
 * Get specific member
 */
export const getMember = async (
  householdId: string,
  OHID: string
): Promise<ApiResponse<HouseholdMember>> => {
  return apiGet<HouseholdMember>(API_ENDPOINTS.MEMBERS.GET(householdId, OHID));
};

/**
 * Remove member from household
 */
export const removeMemberFromHousehold = async (
  householdId: string,
  memberOHID: string
): Promise<ApiResponse<void>> => {
  return apiDelete<void>(
    API_ENDPOINTS.MEMBERS.REMOVE(householdId, memberOHID)
  );
};
