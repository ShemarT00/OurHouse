import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdLists,
  getShoppingList,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList as deleteShoppingListRequest,
  CreateListData,
  UpdateListData,
} from '@/services/list';
import { throwIfError } from '@/services/api';
import { ShoppingList } from '@/types';

export const listsKey = (householdId: string) =>
  ['lists', householdId] as const;

export const listKey = (householdId: string, listOHID: string) =>
  ['list', householdId, listOHID] as const;

/**
 * All shopping lists for a household + create/update/delete mutations
 */
export const useLists = (householdId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: listsKey(householdId),
    queryFn: () => getHouseholdLists(householdId).then(throwIfError),
    enabled: !!householdId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateListData) =>
      createShoppingList(householdId, data).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsKey(householdId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      listOHID,
      data,
    }: {
      listOHID: string;
      data: UpdateListData;
    }) => updateShoppingList(householdId, listOHID, data).then(throwIfError),
    onSuccess: (_data, { listOHID }) => {
      queryClient.invalidateQueries({ queryKey: listsKey(householdId) });
      queryClient.invalidateQueries({
        queryKey: listKey(householdId, listOHID),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listOHID: string) =>
      deleteShoppingListRequest(householdId, listOHID).then(throwIfError),
    onMutate: async (listOHID) => {
      await queryClient.cancelQueries({ queryKey: listsKey(householdId) });
      const previous = queryClient.getQueryData<ShoppingList[]>(listsKey(householdId));
      queryClient.setQueryData<ShoppingList[]>(listsKey(householdId), (old = []) =>
        old.filter(l => l.OHID !== Number(listOHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listsKey(householdId), context.previous);
      }
    },
    onSettled: (_data, _err, listOHID) => {
      queryClient.invalidateQueries({ queryKey: listsKey(householdId) });
      queryClient.removeQueries({ queryKey: listKey(householdId, listOHID) });
    },
  });

  return {
    lists: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createList: createMutation.mutate,
    createListAsync: createMutation.mutateAsync,
    updateList: updateMutation.mutate,
    updateListAsync: updateMutation.mutateAsync,
    deleteList: deleteMutation.mutate,
    deleteListAsync: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

/**
 * Fetch a single shopping list by OHID
 */
export const useList = (householdId: string, listOHID: string) => {
  const query = useQuery({
    queryKey: listKey(householdId, listOHID),
    queryFn: () => getShoppingList(householdId, listOHID).then(throwIfError),
    enabled: !!householdId && !!listOHID,
  });

  return {
    list: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};
