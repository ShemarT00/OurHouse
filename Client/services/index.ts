/**
 * Services Exports
 * Central point for importing all API services
 */

// Configuration
export { supabase, apiConfig, API_ENDPOINTS } from "./config";

// Utilities
export {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  getAuthHeaders,
  throwIfError,
  type ApiError,
  type ApiResponse,
} from "./api";

// Auth Service
export {
  loginWithEmail,
  signupWithEmail,
  logout,
  requestPasswordReset,
  resetPassword,
  getCurrentSession,
  refreshAuthToken,
  type LoginCredentials,
  type SignupData,
  type AuthResponse,
} from "./auth";

// User Service
export {
  getUserProfile,
  getUser,
  updateUserProfile,
  type UpdateUserProfile,
} from "./user";

// Household Service
export {
  getHouseholds,
  getHousehold,
  createHousehold,
  updateHousehold,
  deleteHousehold,
  type CreateHouseholdData,
  type UpdateHouseholdData,
} from "./household";

// Member Service
export {
  getHouseholdMembers,
  getMember,
  inviteMemberToHousehold,
  acceptHouseholdInvite,
  declineHouseholdInvite,
  removeMemberFromHousehold,
  getPendingInvites,
  leaveHousehold,
  type InviteMemberData,
  type MemberInvite,
} from "./member";

// Shopping List Service
export {
  getHouseholdLists,
  getShoppingList,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  archiveShoppingList,
  type CreateListData,
  type UpdateListData,
} from "./list";

// Item Service
export {
  getListItems,
  getItem,
  createItem,
  updateItem,
  toggleItemComplete,
  deleteItem,
  bulkUpdateItems,
  type CreateItemData,
  type UpdateItemData,
  type Priority,
} from "./item";

// Notification Service
export {
  getNotifications,
  getUnreadNotificationsCount,
  getNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  clearReadNotifications,
} from "./notification";

// Store Service
export {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  type Store,
  type CreateStoreData,
  type UpdateStoreData,
} from "./store";
