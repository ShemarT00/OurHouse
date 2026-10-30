import { View, Text, Pressable } from 'react-native';
import type { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  return (
    <Pressable
      className="flex-row items-start gap-3 py-3 border-b border-gray-100 active:bg-gray-50"
      onPress={() => onPress(notification)}
      accessibilityRole="button"
    >
      {notification.read ? (
        <View className="w-2 h-2 mt-1.5" />
      ) : (
        <View accessibilityLabel="Unread" className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
      )}
      <View className="flex-1">
        <Text className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-800 font-semibold'}`}>
          {notification.sentence}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}
