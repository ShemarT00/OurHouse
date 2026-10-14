import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdMembers,
  removeMemberFromHousehold,
} from '@/services/member';
import { throwIfError } from '@/services/api';
import { Member } from '@/types';

/// Query key generator for household members
export const membersKey = (householdId: string) =>
  ['members', householdId] as const;

/// Custom hook to manage household members
export const useHouseholdMembers = (householdId: string) => {
  const queryClient = useQueryClient();

  // Fetch household members
  const query = useQuery({
    queryKey: membersKey(householdId), // Unique query key for members
    queryFn: () => getHouseholdMembers(householdId).then(throwIfError), // Fetch members and handle errors
    enabled: !!householdId, // Only run if householdId is provided
  });

  // Mutation to remove a member from the household
  const removeMutation = useMutation({
    mutationFn: (memberOHID: string) =>
      removeMemberFromHousehold(householdId, memberOHID).then(throwIfError),
    onMutate: async (memberOHID) => { // Update the members list by removing the member immediately
      await queryClient.cancelQueries({ queryKey: membersKey(householdId) });
      const previous = queryClient.getQueryData<Member[]>(membersKey(householdId));
      queryClient.setQueryData<Member[]>(membersKey(householdId), (old = []) =>
        old.filter(m => m.OHID !== Number(memberOHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => { // Rollback to previous members list if the mutation fails
      if (context?.previous) {
        queryClient.setQueryData(membersKey(householdId), context.previous);
      }
    },
    onSettled: () => { // Invalidate members query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: membersKey(householdId) });
    },
  });

  // Return members data and mutation functions
  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    removeMember: removeMutation.mutate,
    removeMemberAsync: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    removeMutation,
  };
};
