/**
 * Item API Service
 * Handles shopping list item operations
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import { Item } from "@/types";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface CreateItemData {
  name: string;
  priority?: Priority;
  quantity?: number;
  notes?: string;
  storeId?: string;
}

export interface UpdateItemData {
  name?: string;
  priority?: Priority;
  quantity?: number;
  notes?: string;
  storeId?: string;
  completed?: boolean;
}

/**
 * Get all items for a shopping list
 */
export const getListItems = async (
  householdId: string,
  listId: string
): Promise<ApiResponse<Item[]>> => {
  return apiGet<Item[]>(
    API_ENDPOINTS.ITEMS.LIST(householdId, listId)
  );
};

/**
 * Get specific item
 */
export const getItem = async (
  householdId: string,
  listId: string,
  OHID: string
): Promise<ApiResponse<Item>> => {
  return apiGet<Item>(
    API_ENDPOINTS.ITEMS.GET(householdId, listId, OHID)
  );
};

/**
 * Create a new item
 */
export const createItem = async (
  householdId: string,
  listId: string,
  data: CreateItemData
): Promise<ApiResponse<Item>> => {
  return apiPost<Item>(
    API_ENDPOINTS.ITEMS.CREATE(householdId, listId),
    data
  );
};

/**
 * Update item
 */
export const updateItem = async (
  householdId: string,
  listId: string,
  itemOHID: string,
  data: UpdateItemData
): Promise<ApiResponse<Item>> => {
  return apiPut<Item>(
    API_ENDPOINTS.ITEMS.UPDATE(householdId, listId, itemOHID),
    data
  );
};

/**
 * Toggle item completion status
 */
export const toggleItemComplete = async (
  householdId: string,
  listId: string,
  itemOHID: string
): Promise<ApiResponse<Item>> => {
  return apiPut<Item>(
    API_ENDPOINTS.ITEMS.TOGGLE_COMPLETE(householdId, listId, itemOHID)
  );
};

/**
 * Delete item
 */
export const deleteItem = async (
  householdId: string,
  listId: string,
  itemOHID: string
): Promise<ApiResponse<void>> => {
  return apiDelete<void>(
    API_ENDPOINTS.ITEMS.DELETE(householdId, listId, itemOHID)
  );
};

/**
 * Bulk update items (e.g., mark multiple as completed)
 */
export const bulkUpdateItems = async (
  householdId: string,
  listId: string,
  updates: Array<{ OHID: string; data: UpdateItemData }>
): Promise<ApiResponse<Item[]>> => {
  const promises = updates.map((update) =>
    updateItem(householdId, listId, update.OHID, update.data)
  );

  const results = await Promise.all(promises);
  const failedResults = results.filter((r) => !r.success);

  if (failedResults.length > 0) {
    return {
      success: false,
      error: {
        message: `${failedResults.length} items failed to update`,
        code: "BULK_UPDATE_FAILED",
      },
    };
  }

  const data = results.map((r) => r.data).filter(Boolean) as Item[];
  return {
    success: true,
    data,
  };
};
