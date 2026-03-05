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

export const HOUSEHOLDS_KEY = ['households'] as const;
export const householdKey = (OHID: string) => ['household', OHID] as const;

/**
 * List all households for the current user + create/update/delete mutations
 */
export const useHouseholds = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: HOUSEHOLDS_KEY,
    queryFn: () => getHouseholds().then(throwIfError),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateHouseholdData) =>
      createHouseholdRequest(data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ OHID, data }: { OHID: string; data: UpdateHouseholdData }) =>
      updateHouseholdRequest(OHID, data).then(throwIfError),
    onSuccess: (_data, { OHID }) => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
      queryClient.invalidateQueries({ queryKey: householdKey(OHID) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (OHID: string) => deleteHouseholdRequest(OHID),
    onSuccess: (_data, OHID) => {
      queryClient.invalidateQueries({ queryKey: HOUSEHOLDS_KEY });
      queryClient.removeQueries({ queryKey: householdKey(OHID) });
    },
  });

  return {
    households: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createHousehold: createMutation.mutate,
    createHouseholdAsync: createMutation.mutateAsync,
    updateHousehold: updateMutation.mutate,
    updateHouseholdAsync: updateMutation.mutateAsync,
    deleteHousehold: deleteMutation.mutate,
    deleteHouseholdAsync: deleteMutation.mutateAsync,
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
