/**
 * Store API Service
 * A household's stores: where its items are bought, and the retailers a store can be linked to
 */

import { apiGet, apiPatch, apiPost, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import type { Retailer, Store } from "@/types";

/** A store's link: a retailer, its own website, or neither (never both) */
export interface StoreLinkData {
  retailerKey: string | null;
  website: string | null;
}

export interface CreateStoreData extends Partial<StoreLinkData> {
  name: string;
}

export type UpdateStoreData = Partial<StoreLinkData> & { name?: string };

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
  return apiPost<Store>(API_ENDPOINTS.STORES.CREATE(householdId), data);
};

/**
 * Edit a store's name and/or link; sending either link field replaces the whole link
 */
export const updateStore = async (
  householdId: string,
  storeId: number,
  data: UpdateStoreData
): Promise<ApiResponse<Store>> => {
  return apiPatch<Store>(API_ENDPOINTS.STORES.UPDATE(householdId, storeId), data);
};

/**
 * Get the retailers a store can be linked to, by name (retired ones are left out)
 */
export const getRetailers = async (): Promise<ApiResponse<Retailer[]>> => {
  return apiGet<Retailer[]>(API_ENDPOINTS.RETAILERS.LIST);
};
