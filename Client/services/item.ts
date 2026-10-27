/**
 * Item API Service
 * Handles shopping list item operations
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import type { Item, Priority } from "@/types";

export interface CreateItemData {
  name: string;
  priority?: Priority;
  quantity?: number | null;
  notes?: string | null;
}

/** Send only the fields to change; null clears quantity or notes */
export interface UpdateItemData {
  name?: string;
  priority?: Priority;
  quantity?: number | null;
  notes?: string | null;
  bought?: boolean;
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
