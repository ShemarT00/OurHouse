/**
 * Authentication API Service
 * Handles login, signup, password reset, and other auth operations
 */

import { apiPost, apiGet, ApiResponse } from "./api";
import { API_ENDPOINTS, supabase } from "./config";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  OHID: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Login with email and password via Supabase
 */
export const loginWithEmail = async (
  credentials: LoginCredentials
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: "AUTH_ERROR",
        },
      };
    }

    if (!data.user?.email) {
      return {
        success: false,
        error: { message: "No user data returned", code: "AUTH_ERROR" },
      };
    }

    // Get additional user profile from backend
    const profileResponse = await apiGet<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN
    );

    return profileResponse;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Login failed",
        code: "AUTH_ERROR",
      },
    };
  }
};

/**
 * Sign up with email and password
 */
export const signupWithEmail = async (
  data: SignupData
): Promise<ApiResponse<AuthResponse>> => {
  try {
    // First, sign up with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      return {
        success: false,
        error: {
          message: authError.message,
          code: "AUTH_ERROR",
        },
      };
    }

    // Then create user profile on backend
    const signupResponse = await apiPost<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      }
    );

    return signupResponse;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Signup failed",
        code: "AUTH_ERROR",
      },
    };
  }
};

/**
 * Logout and clear session
 */
export const logout = async (): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: "AUTH_ERROR",
        },
      };
    }

    // Also notify backend of logout
    await apiPost(API_ENDPOINTS.AUTH.LOGOUT);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Logout failed",
        code: "AUTH_ERROR",
      },
    };
  }
};

/**
 * Request password reset email
 */
export const requestPasswordReset = async (
  email: string
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "ourhouse://reset-password",
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: "AUTH_ERROR",
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Password reset failed",
        code: "AUTH_ERROR",
      },
    };
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: "AUTH_ERROR",
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Password update failed",
        code: "AUTH_ERROR",
      },
    };
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
};

/**
 * Refresh auth token
 */
export const refreshAuthToken = async (): Promise<ApiResponse<AuthResponse>> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return {
        success: false,
        error: {
          message: error?.message || "Failed to refresh token",
          code: "AUTH_ERROR",
        },
      };
    }

    return {
      success: true,
      data: {
        OHID: data.session.user.id,
        email: data.session.user.email || "",
        firstName: "",
        lastName: "",
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token || "",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Token refresh failed",
        code: "AUTH_ERROR",
      },
    };
  }
};
