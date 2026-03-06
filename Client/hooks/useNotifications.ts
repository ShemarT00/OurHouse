import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationRequest,
  clearReadNotifications,
  subscribeToNotifications,
} from '@/services/notification';
import { throwIfError } from '@/services/api';
import { Notification } from '@/types';

export const NOTIFICATIONS_KEY = ['notifications'] as const;
export const NOTIFICATIONS_COUNT_KEY = ['notifications', 'count'] as const;

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => getNotifications().then(throwIfError),
  });

  const countQuery = useQuery({
    queryKey: NOTIFICATIONS_COUNT_KEY,
    queryFn: () => getUnreadNotificationsCount().then(throwIfError),
  });

  // Subscribe to real-time notifications via Supabase
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(
      userId,
      (_notification: Notification) => {
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
      }
    );

    return unsubscribe;
  }, [userId, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (OHID: string) =>
      markNotificationAsRead(OHID).then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead().then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (OHID: string) => deleteNotificationRequest(OHID).then(throwIfError),
    onMutate: async (OHID) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old = []) =>
        old.filter(n => n.OHID !== Number(OHID))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });

  const clearReadMutation = useMutation({
    mutationFn: () => clearReadNotifications().then(throwIfError),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  return {
    notifications: query.data ?? [],
    unreadCount: countQuery.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    markRead: markReadMutation.mutate,
    markReadAsync: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutate,
    markAllReadAsync: markAllReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutate,
    deleteNotificationAsync: deleteMutation.mutateAsync,
    clearRead: clearReadMutation.mutate,
    clearReadAsync: clearReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearing: clearReadMutation.isPending,
    markReadMutation,
    markAllReadMutation,
    deleteMutation,
    clearReadMutation,
  };
};
