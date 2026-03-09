import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Notification } from '../types';
import { NotificationItem } from '../components/molecules';

const NotificationsScreen: React.FC = () => {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      // TODO: fetch notifications for current member from API
      return [];
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-8 pb-4">
        <Text className="text-2xl font-bold">Notifications</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.OHID.toString()}
          contentContainerClassName="px-4 gap-3 pb-8"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400 text-base">No notifications yet.</Text>
            </View>
          }
          renderItem={({ item }) => <NotificationItem notification={item} />}
        />
      )}
    </View>
  );
};

export default NotificationsScreen;
