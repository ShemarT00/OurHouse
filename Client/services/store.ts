/**
 * Store API Service
 * A household's stores: where its items are bought
 */

import { apiGet, apiPost, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import type { Store } from "@/types";

export interface CreateStoreData {
  name: string;
}

/**
 * Get a household's stores, by name
 */
export const getHouseholdStores = async (
  householdId: string
): Promise<ApiResponse<Store[]>> => {
  return apiGet<Store[]>(API_ENDPOINTS.STORES.LIST(householdId));
};

/**
 * Add a store to a household
 */
export const createStore = async (
  householdId: string,
  data: CreateStoreData
): Promise<ApiResponse<Store>> => {
  const response = await apiPost<Store>(API_ENDPOINTS.STORES.CREATE(householdId), data);
  // Names are checked before sending, so a 400 means the household already has this store
  if (response.error?.status === 400) {
    return {
      ...response,
      error: { ...response.error, message: "This household already has a store with that name." },
    };
  }
  return response;
};
