/**
 * Shopping List API Service
 * Handles shopping list operations
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import { ShoppingList } from "@/types";

export interface CreateListData {
  name: string;
}

export interface UpdateListData {
  name?: string;
}

/**
 * Get all shopping lists for a household
 */
export const getHouseholdLists = async (
  householdId: string
): Promise<ApiResponse<ShoppingList[]>> => {
  return apiGet<ShoppingList[]>(
    API_ENDPOINTS.LISTS.LIST(householdId)
  );
};

/**
 * Get specific shopping list
 */
export const getShoppingList = async (
  householdId: string,
  OHID: string
): Promise<ApiResponse<ShoppingList>> => {
  return apiGet<ShoppingList>(
    API_ENDPOINTS.LISTS.GET(householdId, OHID)
  );
};

/**
 * Create a new shopping list
 */
export const createShoppingList = async (
  householdId: string,
  data: CreateListData
): Promise<ApiResponse<ShoppingList>> => {
  return apiPost<ShoppingList>(
    API_ENDPOINTS.LISTS.CREATE(householdId),
    data
  );
};

/**
 * Update shopping list
 */
export const updateShoppingList = async (
  householdId: string,
  listOHID: string,
  data: UpdateListData
): Promise<ApiResponse<ShoppingList>> => {
  return apiPut<ShoppingList>(
    API_ENDPOINTS.LISTS.UPDATE(householdId, listOHID),
    data
  );
};

/**
 * Delete shopping list
 */
export const deleteShoppingList = async (
  householdId: string,
  listOHID: string
): Promise<ApiResponse<void>> => {
  return apiDelete<void>(
    API_ENDPOINTS.LISTS.DELETE(householdId, listOHID)
  );
};
