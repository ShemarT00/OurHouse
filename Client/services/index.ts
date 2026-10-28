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
  type LoginCredentials,
  type SignupData,
  type SignupResult,
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
  removeMemberFromHousehold,
} from "./member";

// Shopping List Service
export {
  getHouseholdLists,
  getShoppingList,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
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
  type CreateItemData,
  type UpdateItemData,
} from "./item";

// Notification Service
export {
  getNotifications,
  getUnreadNotificationsCount,
  getNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} from "./notification";

// Store Service
export {
  getHouseholdStores,
  createStore,
  type CreateStoreData,
} from "./store";

// Realtime Service
export { subscribeToListItems } from "./realtime";
