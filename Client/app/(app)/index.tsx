import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useHouseholds } from '@/hooks/useHouseholds';
import type { Household } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { households, isLoading, error, refetch, isRefetching } = useHouseholds();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-red-500 text-center">{error.message}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-2xl font-bold">My Households</Text>
        <View className="flex-row gap-2">
          <Pressable
            className="border border-blue-600 px-4 py-2 rounded-lg active:bg-blue-50"
            onPress={() => router.push('/(app)/household/join')}
          >
            <Text className="text-blue-600 font-semibold">Join</Text>
          </Pressable>
          <Pressable
            className="bg-blue-600 px-4 py-2 rounded-lg active:bg-blue-700"
            onPress={() => router.push('/(app)/household/create')}
          >
            <Text className="text-white font-semibold">+ New</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={households}
        keyExtractor={(item: Household) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <Pressable
            className="border border-gray-200 rounded-xl p-4 mb-3"
            onPress={() => router.push({ pathname: '/(app)/household/[id]', params: { id: item.OHID } })}
          >
            <Text className="text-lg font-semibold">{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-base">No households yet.</Text>
            <Text className="text-gray-400 text-sm mt-1">Create one, or join one with an invite code.</Text>
          </View>
        }
      />
    </View>
  );
}
