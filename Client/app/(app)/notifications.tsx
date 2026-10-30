import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/molecules';
import type { Notification } from '@/types';

// The inbox: the member's notifications, newest first (the server orders them)
export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, refetch, isRefetching, unreadCount, markRead, markAllRead, isMarkingAllRead } =
    useNotifications();

  // Mark it read and open its shopping list; a removed item's list still opens.
  // If the list itself was deleted there is nowhere to go, so it is only marked read.
  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      markRead(notification.OHID);
    }
    if (notification.listId !== null) {
      router.push({
        pathname: '/(app)/list/[id]',
        params: { id: notification.listId, householdId: notification.householdId },
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
        <Text className="text-2xl font-bold">Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={() => markAllRead()} disabled={isMarkingAllRead} className="disabled:opacity-50">
            <Text className="text-blue-600 font-semibold">Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => <NotificationItem notification={item} onPress={openNotification} />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-base">No notifications.</Text>
          </View>
        }
      />
    </View>
  );
}
