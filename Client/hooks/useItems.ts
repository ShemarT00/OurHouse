import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getListItems,
  createItem as createItemRequest,
  updateItem as updateItemRequest,
  deleteItem as deleteItemRequest,
  toggleItemComplete,
  CreateItemData,
  UpdateItemData,
} from '@/services/item';
import { throwIfError } from '@/services/api';
import { Item } from '@/types';

export const itemsKey = (householdId: string, listId: string) =>
  ['items', householdId, listId] as const;

export const useItems = (householdId: string, listId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: itemsKey(householdId, listId),
    queryFn: () => getListItems(householdId, listId).then(throwIfError),
    enabled: !!householdId && !!listId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateItemData) =>
      createItemRequest(householdId, listId, data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKey(householdId, listId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemOHID,
      data,
    }: {
      itemOHID: string;
      data: UpdateItemData;
    }) =>
      updateItemRequest(householdId, listId, itemOHID, data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKey(householdId, listId) });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (itemOHID: string) =>
      toggleItemComplete(householdId, listId, itemOHID).then(throwIfError),
    onMutate: async (itemOHID) => {
      await queryClient.cancelQueries({ queryKey: itemsKey(householdId, listId) });
      const previous = queryClient.getQueryData<Item[]>(itemsKey(householdId, listId));
      queryClient.setQueryData<Item[]>(itemsKey(householdId, listId), (old = []) =>
        old.map(item =>
          item.OHID === Number(itemOHID)
            ? { ...item, isCompleted: !item.isCompleted }
            : item
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemsKey(householdId, listId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemsKey(householdId, listId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemOHID: string) =>
      deleteItemRequest(householdId, listId, itemOHID).then(throwIfError),
    onMutate: async (itemOHID) => {
      await queryClient.cancelQueries({ queryKey: itemsKey(householdId, listId) });
      const previous = queryClient.getQueryData<Item[]>(itemsKey(householdId, listId));
      queryClient.setQueryData<Item[]>(itemsKey(householdId, listId), (old = []) =>
        old.filter(item => item.OHID !== Number(itemOHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(itemsKey(householdId, listId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemsKey(householdId, listId) });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addItem: createMutation.mutate,
    addItemAsync: createMutation.mutateAsync,
    updateItem: updateMutation.mutate,
    updateItemAsync: updateMutation.mutateAsync,
    toggleItem: toggleMutation.mutate,
    toggleItemAsync: toggleMutation.mutateAsync,
    removeItem: deleteMutation.mutate,
    removeItemAsync: deleteMutation.mutateAsync,
    isAdding: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isToggling: toggleMutation.isPending,
    isRemoving: deleteMutation.isPending,
    createMutation,
    updateMutation,
    toggleMutation,
    deleteMutation,
  };
};
