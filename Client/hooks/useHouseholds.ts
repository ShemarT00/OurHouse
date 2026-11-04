import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholds,
  getHousehold,
  createHousehold as createHouseholdRequest,
  joinHousehold as joinHouseholdRequest,
  updateHousehold as updateHouseholdRequest,
  deleteHousehold as deleteHouseholdRequest,
  setHouseholdMuted,
  CreateHouseholdData,
  JoinHouseholdData,
  UpdateHouseholdData,
} from '@/services/household';
import { throwIfError } from '@/services/api';
import type { MemberHousehold } from '@/types';

export const HOUSEHOLDS_KEY = ['households'] as const; // Query key for households list
export const householdKey = (OHID: string) => ['household', OHID] as const; // Query key generator for individual household

/**
 * List all households for the current user + create/update/delete mutations
 */
export const useHouseholds = () => {
  const queryClient = useQueryClient();

  /**
   * Fetch all households for the current user
   */
  const query = useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => getHouseholds().then(throwIfError),
  });

  /**
   * Mutation to create a new household
   */
  const createMutation = useMutation({
    mutationFn: (data: CreateHouseholdData) =>
      createHouseholdRequest(data).then(throwIfError), // Call the API to create a household and handle errors
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY }); // Invalidate households query to refetch the updated list
    },
  });
  /**
   * Mutation to join a household with its invite code
   */
  const joinMutation = useMutation({
    mutationFn: (data: JoinHouseholdData) => joinHouseholdRequest(data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
    },
  });

  /**
   * Mutation to update an existing household
   */
  const updateMutation = useMutation({
    mutationFn: ({ OHID, data }: { OHID: string; data: UpdateHouseholdData }) =>
      updateHouseholdRequest(OHID, data).then(throwIfError),
    onSuccess: (_data, { OHID }) => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
      queryClient.invalidateQueries({ queryKey: householdKey(OHID) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (OHID: string) => deleteHouseholdRequest(OHID).then(throwIfError),
    onMutate: async (OHID) => {
      await queryClient.cancelQueries({ queryKey: HOUSEHOLDS_KEY });
      const previous = queryClient.getQueryData<MemberHousehold[]>(HOUSEHOLDS_KEY);
      queryClient.setQueryData<MemberHousehold[]>(HOUSEHOLDS_KEY, (old = []) =>
        old.filter(h => h.OHID !== Number(OHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HOUSEHOLDS_KEY, context.previous);
      }
    },
    onSettled: (_data, _err, OHID) => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
      queryClient.removeQueries({ queryKey: householdKey(OHID) });
    },
  });

  /**
   * Mute or unmute the user's own membership of a household.
   * The switch flips straight away and flips back if saving fails.
   */
  // The last failed mute; kept here because muteMutation only reflects its latest call
  const [muteError, setMuteError] = useState<Error | null>(null);
  const showMuted = (OHID: number, muted: boolean) =>
    queryClient.setQueryData<MemberHousehold[]>(HOUSEHOLDS_KEY, (old = []) =>
      old.map(h => (h.OHID === OHID ? { ...h, muted } : h))
    );
  const muteMutation = useMutation({
    mutationFn: ({ OHID, muted }: { OHID: number; muted: boolean }) =>
      setHouseholdMuted(OHID, muted).then(throwIfError),
    onMutate: async ({ OHID, muted }) => {
      setMuteError(null);
      await queryClient.cancelQueries({ queryKey: HOUSEHOLDS_KEY });
      showMuted(OHID, muted);
    },
    // Only this household flips back, so a switch saved meanwhile keeps its new state
    onError: (error, { OHID, muted }) => {
      showMuted(OHID, !muted);
      setMuteError(error);
    },
  });

  return {
    households: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    createHousehold: createMutation.mutate,
    createHouseholdAsync: createMutation.mutateAsync,
    joinHousehold: joinMutation.mutate,
    joinHouseholdAsync: joinMutation.mutateAsync,
    updateHousehold: updateMutation.mutate,
    updateHouseholdAsync: updateMutation.mutateAsync,
    deleteHousehold: deleteMutation.mutate,
    deleteHouseholdAsync: deleteMutation.mutateAsync,
    setMuted: muteMutation.mutate,
    setMutedAsync: muteMutation.mutateAsync,
    muteError,
    isCreating: createMutation.isPending,
    isJoining: joinMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createMutation,
    joinMutation,
    updateMutation,
    deleteMutation,
    muteMutation,
  };
};

/**
 * Fetch a single household by OHID
 */
export const useHousehold = (OHID: string) => {
  const query = useQuery({
    queryKey: householdKey(OHID),
    queryFn: () => getHousehold(OHID).then(throwIfError),
    enabled: !!OHID,
  });

  return {
    household: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
