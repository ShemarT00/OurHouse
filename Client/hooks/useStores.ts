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
import { Store } from '@/types';

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
    mutationFn: (OHID: string) => deleteStoreRequest(OHID).then(throwIfError),
    onMutate: async (OHID) => {
      await queryClient.cancelQueries({ queryKey: STORES_KEY });
      const previous = queryClient.getQueryData<Store[]>(STORES_KEY);
      queryClient.setQueryData<Store[]>(STORES_KEY, (old = []) =>
        old.filter(s => s.OHID !== Number(OHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(STORES_KEY, context.previous);
      }
    },
    onSettled: (_data, _err, OHID) => {
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
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
