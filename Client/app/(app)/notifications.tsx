import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types';

export default function NotificationsScreen() {
  const { supabaseUser } = useAuth();
  const { notifications, isLoading, markAllRead, isMarkingAllRead } =
    useNotifications(supabaseUser?.id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold">Notifications</Text>
        {notifications.length > 0 && (
          <Pressable onPress={() => markAllRead()} disabled={isMarkingAllRead}>
            <Text className="text-blue-600 text-sm">Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: Notification) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="border border-gray-200 rounded-xl p-4 mb-3">
            <Text className="text-base">{item.message}</Text>
            <Text className="text-xs text-gray-400 mt-1">{item.createdAt}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-base">No notifications.</Text>
          </View>
        }
      />
    </View>
  );
}
