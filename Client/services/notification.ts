/**
 * Notification API Service
 * Handles notification operations
 */

import { apiGet, apiPost, apiDelete, ApiResponse } from "./api";
import { API_ENDPOINTS } from "./config";
import { Notification } from "@/types";

/**
 * Get all notifications for current user
 */
export const getNotifications = async (): Promise<
  ApiResponse<Notification[]>
> => {
  return apiGet<Notification[]>(API_ENDPOINTS.NOTIFICATIONS.LIST);
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (): Promise<
  ApiResponse<{ count: number }>
> => {
  return apiGet<{ count: number }>(
    API_ENDPOINTS.NOTIFICATIONS.LIST + "?unread=true&count=true"
  );
};

/**
 * Get specific notification
 */
export const getNotification = async (OHID: string): Promise<
  ApiResponse<Notification>
> => {
  return apiGet<Notification>(API_ENDPOINTS.NOTIFICATIONS.GET(OHID));
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  OHID: string
): Promise<ApiResponse<Notification>> => {
  return apiPost<Notification>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(OHID)
  );
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<
  ApiResponse<void>
> => {
  return apiPost<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
};

/**
 * Delete notification
 */
export const deleteNotification = async (OHID: string): Promise<
  ApiResponse<void>
> => {
  return apiDelete<void>(API_ENDPOINTS.NOTIFICATIONS.DELETE(OHID));
};

/**
 * Subscribe to notification updates via Supabase real-time
 * This uses Supabase's real-time subscriptions
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void
) => {
  // This will be implemented with Supabase real-time
  // Returns unsubscribe function
  return () => {};
};

/**
 * Clear all read notifications
 */
export const clearReadNotifications = async (): Promise<
  ApiResponse<{ deletedCount: number }>
> => {
  return apiDelete<{ deletedCount: number }>(
    API_ENDPOINTS.NOTIFICATIONS.LIST + "?status=read"
  );
};
