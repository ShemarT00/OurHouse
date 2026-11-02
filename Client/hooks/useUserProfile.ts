import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, UpdateUserProfile } from '@/services/user';
import { throwIfError } from '@/services/api';

export const USER_PROFILE_KEY = ['userProfile'] as const;

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: USER_PROFILE_KEY,
    queryFn: () => getUserProfile().then(throwIfError),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) =>
      updateUserProfile(data).then(throwIfError),
    // The response is the updated profile, so show it now rather than after a refetch
    onSuccess: (user) => {
      queryClient.setQueryData(USER_PROFILE_KEY, user);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    updateMutation,
  };
};
