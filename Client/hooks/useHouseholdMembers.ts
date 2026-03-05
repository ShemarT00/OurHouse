import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdMembers,
  inviteMemberToHousehold,
  removeMemberFromHousehold,
  leaveHousehold as leaveHouseholdRequest,
  InviteMemberData,
} from '@/services/member';
import { throwIfError } from '@/services/api';

export const membersKey = (householdId: string) =>
  ['members', householdId] as const;

export const useHouseholdMembers = (householdId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: membersKey(householdId),
    queryFn: () => getHouseholdMembers(householdId).then(throwIfError),
    enabled: !!householdId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteMemberData) =>
      inviteMemberToHousehold(householdId, data).then(throwIfError),
  });

  const removeMutation = useMutation({
    mutationFn: (memberOHID: string) =>
      removeMemberFromHousehold(householdId, memberOHID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(householdId) });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveHouseholdRequest(householdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(householdId) });
    },
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    inviteMember: inviteMutation.mutate,
    inviteMemberAsync: inviteMutation.mutateAsync,
    removeMember: removeMutation.mutate,
    removeMemberAsync: removeMutation.mutateAsync,
    leaveHousehold: leaveMutation.mutate,
    leaveHouseholdAsync: leaveMutation.mutateAsync,
    inviteMutation,
    removeMutation,
    leaveMutation,
  };
};
