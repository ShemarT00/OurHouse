import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Item } from '../../types';

export const useListItems = (listId: number) => {
  return useQuery<Item[]>({
    queryKey: ['items', listId],
    queryFn: async () => {
      // TODO: fetch items for list from API
      return [];
    },
  });
};

export const useToggleItem = (listId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) => {
      // TODO: call API to toggle item completion
      console.log(itemId, isCompleted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
  });
};

export const useDeleteItem = (listId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      // TODO: call API to delete item

      console.log(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
  });
};
