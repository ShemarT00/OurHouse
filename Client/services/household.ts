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
