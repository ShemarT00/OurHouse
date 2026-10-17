import { useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/services/config';
import { throwIfError } from '@/services/api';
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
   * Mutation to log in a user with email and password.
   * On success, the auth state is updated by the onAuthStateChange listener.
   * On failure (e.g. wrong password) it rejects, so loginAsync throws and
   * loginMutation.error holds the message to show.
   */
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => throwIfError(await loginWithEmail(credentials)),
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => throwIfError(await signupWithEmail(data)),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => throwIfError(await logout()),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => throwIfError(await requestPasswordReset(email)),
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
