/**
 * Household API Service
 * Handles household management operations
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import { Household } from "@/types";

export interface CreateHouseholdData {
  name: string;
}

export interface UpdateHouseholdData {
  name?: string;
}

export interface JoinHouseholdData {
  code: string;
}

/**
 * Get all households for current user
 */
export const getHouseholds = async (): Promise<
  ApiResponse<Household[]>
> => {
  return apiGet<Household[]>(API_ENDPOINTS.HOUSEHOLDS.LIST);
};

/**
 * Get household by OHID
 */
export const getHousehold = async (OHID: string): Promise<
  ApiResponse<Household>
> => {
  return apiGet<Household>(API_ENDPOINTS.HOUSEHOLDS.GET(OHID));
};

/**
 * Create a new household
 */
export const createHousehold = async (
  data: CreateHouseholdData
): Promise<ApiResponse<Household>> => {
  return apiPost<Household>(API_ENDPOINTS.HOUSEHOLDS.CREATE, data);
};

/**
 * Join a household with its invite code (joining twice is harmless)
 */
export const joinHousehold = async (
  data: JoinHouseholdData
): Promise<ApiResponse<Household>> => {
  const response = await apiPost<Household>(API_ENDPOINTS.HOUSEHOLDS.JOIN, {
    code: data.code.trim().toUpperCase(),
  });
  if (response.error?.status === 404) {
    return {
      ...response,
      error: { ...response.error, message: "No household has that invite code. Check it and try again." },
    };
  }
  return response;
};

/**
 * Update household
 */
export const updateHousehold = async (
  OHID: string,
  data: UpdateHouseholdData
): Promise<ApiResponse<Household>> => {
  return apiPut<Household>(
    API_ENDPOINTS.HOUSEHOLDS.UPDATE(OHID),
    data
  );
};

/**
 * Delete household
 */
export const deleteHousehold = async (OHID: string): Promise<
  ApiResponse<void>
> => {
  return apiDelete<void>(API_ENDPOINTS.HOUSEHOLDS.DELETE(OHID));
};
