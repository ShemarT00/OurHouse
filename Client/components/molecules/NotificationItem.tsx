import { View, Text } from 'react-native';
import type { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <View className="flex-row items-start gap-3 py-3 border-b border-gray-100">
      <View className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
      <View className="flex-1">
        <Text className="text-sm text-gray-800">{notification.message}</Text>
        <Text className="text-xs text-gray-400 mt-1">{notification.createdAt}</Text>
      </View>
    </View>
  );
}
