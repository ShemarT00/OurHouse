/**
 * Store API Service
 * Handles store/location management for shopping items
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";

export interface Store {
  OHID: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CreateStoreData {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateStoreData {
  name?: string;
  address?: string;
  phone?: string;
}

/**
 * Get all stores (global or user's custom stores)
 */
export const getStores = async (): Promise<ApiResponse<Store[]>> => {
  return apiGet<Store[]>(API_ENDPOINTS.STORES.LIST);
};

/**
 * Get specific store
 */
export const getStore = async (OHID: string): Promise<
  ApiResponse<Store>
> => {
  return apiGet<Store>(API_ENDPOINTS.STORES.GET(OHID));
};

/**
 * Create custom store
 */
export const createStore = async (
  data: CreateStoreData
): Promise<ApiResponse<Store>> => {
  return apiPost<Store>(API_ENDPOINTS.STORES.CREATE, data);
};

/**
 * Update store
 */
export const updateStore = async (
  OHID: string,
  data: UpdateStoreData
): Promise<ApiResponse<Store>> => {
  return apiPut<Store>(API_ENDPOINTS.STORES.UPDATE(OHID), data);
};

/**
 * Delete store
 */
export const deleteStore = async (OHID: string): Promise<
  ApiResponse<void>
> => {
  return apiDelete<void>(API_ENDPOINTS.STORES.DELETE(OHID));
};
