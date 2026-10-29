import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/molecules';
import type { Notification } from '@/types';

// The inbox: the member's notifications, newest first (the server orders them)
export default function NotificationsScreen() {
  const { notifications, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4">
        <Text className="text-2xl font-bold">Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-base">No notifications.</Text>
          </View>
        }
      />
    </View>
  );
}
