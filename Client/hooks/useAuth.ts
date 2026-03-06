import { useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/config';
import {
  loginWithEmail,
  signupWithEmail,
  logout,
  requestPasswordReset,
  LoginCredentials,
  SignupData,
} from '@/services/auth';

interface AuthState {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
}
// Custom hook to manage authentication state and actions
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    supabaseUser: null,
    isLoading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        supabaseUser: session?.user ?? null,
        isLoading: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        session,
        supabaseUser: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Mutation to log in a user with email and password
   * Handles the API call and updates the authentication state based on the response.
   * On success, the auth state will be updated by the onAuthStateChange listener.
   * On error, it will throw the error to be handled by the caller.
   */
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => loginWithEmail(credentials),
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => signupWithEmail(data),
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });

  return {
    session: authState.session,
    supabaseUser: authState.supabaseUser,
    isAuthenticated: !!authState.session,
    isLoading: authState.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutate,
    forgotPasswordAsync: forgotPasswordMutation.mutateAsync,
    loginMutation,
    signupMutation,
    logoutMutation,
    forgotPasswordMutation,
  };
};
