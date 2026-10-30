/**
 * Notification API Service
 * Handles notification operations
 */

import { apiGet, apiPost, ApiResponse } from "./api";
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
 * Get unread notifications count (last 30 days)
 */
export const getUnreadNotificationsCount = async (): Promise<
  ApiResponse<{ count: number }>
> => {
  return apiGet<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
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
  OHID: number
): Promise<ApiResponse<Notification>> => {
  return apiPost<Notification>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(OHID)
  );
};

/**
 * Mark all notifications as read; returns how many changed
 */
export const markAllNotificationsAsRead = async (): Promise<
  ApiResponse<{ count: number }>
> => {
  return apiPost<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
};
