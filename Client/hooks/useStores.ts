import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdStores,
  createStore as createStoreRequest,
  updateStore as updateStoreRequest,
} from '@/services/store';
import type { CreateStoreData, UpdateStoreData } from '@/services/store';
import { throwIfError } from '@/services/api';

export const storesKey = (householdId: string) => ['stores', householdId] as const;

/**
 * A household's stores + add-store and edit-store mutations
 */
export const useStores = (householdId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: storesKey(householdId),
    queryFn: () => getHouseholdStores(householdId).then(throwIfError),
    enabled: !!householdId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStoreData) =>
      createStoreRequest(householdId, data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storesKey(householdId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ storeId, data }: { storeId: number; data: UpdateStoreData }) =>
      updateStoreRequest(householdId, storeId, data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storesKey(householdId) });
    },
  });

  return {
    stores: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    createStore: createMutation.mutate,
    createStoreAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createMutation,
    updateStore: updateMutation.mutate,
    updateStoreAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateMutation,
  };
};
