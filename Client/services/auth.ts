/**
 * Authentication API Service
 * Sign-up, login, logout and password reset go straight to Supabase Auth.
 * The "USER" profile row is created by a database trigger at sign-up
 * (database/migrations/004_auth_users.sql), so there is no backend call here.
 */

import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { ApiResponse } from "./api";
import { supabase } from "./config";

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

export interface SignupResult {
  /** True when Supabase requires the user to confirm their email before logging in */
  needsConfirmation: boolean;
}

/** Supabase error messages rewritten for people using the app */
const FRIENDLY_AUTH_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "Email not confirmed": "Check your email to confirm your account, then sign in.",
  "User already registered": "An account with this email already exists.",
};

const authFailure = <T>(error: unknown, fallback: string): ApiResponse<T> => {
  const message = error instanceof Error ? error.message : fallback;
  return {
    success: false,
    error: { message: FRIENDLY_AUTH_MESSAGES[message] ?? message, code: "AUTH_ERROR" },
  };
};

/**
 * Login with email and password via Supabase
 */
export const loginWithEmail = async (
  credentials: LoginCredentials
): Promise<ApiResponse<SupabaseUser>> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) {
      return authFailure(error, "Login failed");
    }
    return { success: true, data: data.user };
  } catch (error) {
    return authFailure(error, "Login failed");
  }
};

/**
 * Sign up with email and password. First and last name travel as user
 * metadata; the database trigger copies them into the "USER" row.
 */
export const signupWithEmail = async (
  data: SignupData
): Promise<ApiResponse<SignupResult>> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { first_name: data.firstName.trim(), last_name: data.lastName.trim() },
      },
    });
    if (error) {
      return authFailure(error, "Signup failed");
    }
    return { success: true, data: { needsConfirmation: !authData.session } };
  } catch (error) {
    return authFailure(error, "Signup failed");
  }
};

/**
 * Logout and clear the stored session
 */
export const logout = async (): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return authFailure(error, "Logout failed");
    }
    return { success: true };
  } catch (error) {
    return authFailure(error, "Logout failed");
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
      return authFailure(error, "Password reset failed");
    }
    return { success: true };
  } catch (error) {
    return authFailure(error, "Password reset failed");
  }
};

/**
 * Set a new password for the signed-in user (after following the reset link)
 */
export const resetPassword = async (
  newPassword: string
): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return authFailure(error, "Password update failed");
    }
    return { success: true };
  } catch (error) {
    return authFailure(error, "Password update failed");
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
};
