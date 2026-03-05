import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPendingInvites,
  acceptHouseholdInvite,
  declineHouseholdInvite,
} from '@/services/member';
import { throwIfError } from '@/services/api';

export const INVITES_KEY = ['invites'] as const;

export const useMemberInvites = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: INVITES_KEY,
    queryFn: () => getPendingInvites().then(throwIfError),
  });

  const acceptMutation = useMutation({
    mutationFn: (inviteId: string) =>
      acceptHouseholdInvite(inviteId).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEY });
      // Refresh households list since a new one was just joined
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (inviteId: string) => declineHouseholdInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEY });
    },
  });

  return {
    invites: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    acceptInvite: acceptMutation.mutate,
    acceptInviteAsync: acceptMutation.mutateAsync,
    declineInvite: declineMutation.mutate,
    declineInviteAsync: declineMutation.mutateAsync,
    acceptMutation,
    declineMutation,
  };
};
