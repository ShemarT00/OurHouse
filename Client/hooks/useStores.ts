import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStores,
  createStore as createStoreRequest,
  updateStore as updateStoreRequest,
  deleteStore as deleteStoreRequest,
  CreateStoreData,
  UpdateStoreData,
} from '@/services/store';
import { throwIfError } from '@/services/api';

export const STORES_KEY = ['stores'] as const;
export const storeKey = (OHID: string) => ['store', OHID] as const;

export const useStores = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: STORES_KEY,
    queryFn: () => getStores().then(throwIfError),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStoreData) =>
      createStoreRequest(data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ OHID, data }: { OHID: string; data: UpdateStoreData }) =>
      updateStoreRequest(OHID, data).then(throwIfError),
    onSuccess: (_data, { OHID }) => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY });
      queryClient.invalidateQueries({ queryKey: storeKey(OHID) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (OHID: string) => deleteStoreRequest(OHID),
    onSuccess: (_data, OHID) => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY });
      queryClient.removeQueries({ queryKey: storeKey(OHID) });
    },
  });

  return {
    stores: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createStore: createMutation.mutate,
    createStoreAsync: createMutation.mutateAsync,
    updateStore: updateMutation.mutate,
    updateStoreAsync: updateMutation.mutateAsync,
    deleteStore: deleteMutation.mutate,
    deleteStoreAsync: deleteMutation.mutateAsync,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
