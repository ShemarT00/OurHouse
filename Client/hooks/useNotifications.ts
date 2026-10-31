import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { // Notification-related API functions
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notification';
import { throwIfError } from '@/services/api';
import { subscribeToInbox } from '@/services/realtime';

export const NOTIFICATIONS_KEY = ['notifications'] as const; // Query key for notifications list
export const NOTIFICATIONS_COUNT_KEY = ['notifications', 'count'] as const; // Query key for unread notifications count

// Custom hook to manage notifications
export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => getNotifications().then(throwIfError),
  });

  /**
   * Fetch count of unread notifications
   */
  const countQuery = useQuery({
    queryKey: NOTIFICATIONS_COUNT_KEY,
    queryFn: () => getUnreadNotificationsCount().then(throwIfError),
  });

  // Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: (OHID: number) =>
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

  return {
    notifications: query.data ?? [],
    unreadCount: countQuery.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    // Pull-to-refresh reloads the badge too
    refetch: () => Promise.all([query.refetch(), countQuery.refetch()]),
    isRefetching: query.isRefetching,
    markRead: markReadMutation.mutate,
    markReadAsync: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutate,
    markAllReadAsync: markAllReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    markReadMutation,
    markAllReadMutation,
  };
};

/**
 * Keep the inbox and unread count current while signed in: refetch both
 * whenever the member receives a new notification. Unsubscribes on sign-out.
 */
export const useLiveNotifications = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeToInbox(userId, () => {
      // NOTIFICATIONS_KEY is a prefix of NOTIFICATIONS_COUNT_KEY, so this refreshes both
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    });
  }, [userId, queryClient]);
};
