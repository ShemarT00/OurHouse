import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholds,
  getHousehold,
  createHousehold as createHouseholdRequest,
  updateHousehold as updateHouseholdRequest,
  deleteHousehold as deleteHouseholdRequest,
  CreateHouseholdData,
  UpdateHouseholdData,
} from '@/services/household';
import { throwIfError } from '@/services/api';
import { Household } from '@/types';

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
      const previous = queryClient.getQueryData<Household[]>(HOUSEHOLDS_KEY);
      queryClient.setQueryData<Household[]>(HOUSEHOLDS_KEY, (old = []) =>
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

  return {
    households: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    createHousehold: createMutation.mutate,
    createHouseholdAsync: createMutation.mutateAsync,
    updateHousehold: updateMutation.mutate,
    updateHouseholdAsync: updateMutation.mutateAsync,
    deleteHousehold: deleteMutation.mutate,
    deleteHouseholdAsync: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createMutation,
    updateMutation,
    deleteMutation,
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
