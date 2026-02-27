/**
 * API Utilities
 * Handles HTTP requests, error handling, and common API logic
 */

import { apiConfig, supabase } from "./config";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

/**
 * Make a GET request
 */
export const apiGet = async <T>(
  endpoint: string
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: "GET",
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
};

/**
 * Make a POST request
 */
export const apiPost = async <T>(
  endpoint: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
};

/**
 * Make a PUT request
 */
export const apiPut = async <T>(
  endpoint: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: "PUT",
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
};

/**
 * Make a PATCH request
 */
export const apiPatch = async <T>(
  endpoint: string,
  data?: Record<string, any>
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
};

/**
 * Make a DELETE request
 */
export const apiDelete = async <T>(
  endpoint: string
): Promise<ApiResponse<T>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
      method: "DELETE",
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    return handleApiError<T>(error);
  }
};

/**
 * Handle API response and parse JSON
 */
const handleApiResponse = async <T>(
  response: Response
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get("content-type");
  let data: T | undefined;

  if (contentType?.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    return {
      success: false,
      error: {
        message: `HTTP ${response.status}`,
        status: response.status,
        code: `HTTP_${response.status}`,
        details: typeof data === "object" ? data : undefined,
      },
    };
  }

  return {
    success: true,
    data,
  };
};

/**
 * Handle API errors
 */
const handleApiError = <T>(error: unknown): ApiResponse<T> => {
  const message = error instanceof Error ? error.message : "Unknown error";

  return {
    success: false,
    error: {
      message,
      code: "NETWORK_ERROR",
    },
  };
};

/**
 * Throws error if API response is not successful
 * Useful for TanStack Query
 */
export const throwIfError = <T>(response: ApiResponse<T>): T => {
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || "Unknown error occurred");
  }
  return response.data;
};
