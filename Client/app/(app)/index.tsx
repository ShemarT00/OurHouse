import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useHouseholds } from '@/hooks/useHouseholds';
import { Household } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { households, isLoading, error } = useHouseholds();

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
        <Pressable
          className="bg-blue-600 px-4 py-2 rounded-lg"
          onPress={() => router.push('/(app)/household/create')}
        >
          <Text className="text-white font-semibold">+ New</Text>
        </Pressable>
      </View>

      <FlatList
        data={households}
        keyExtractor={(item: Household) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            className="border border-gray-200 rounded-xl p-4 mb-3"
            onPress={() => router.push(`/(app)/household/${item.OHID}`)}
          >
            <Text className="text-lg font-semibold">{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-gray-400 text-base">No households yet.</Text>
            <Text className="text-gray-400 text-sm mt-1">Create one to get started.</Text>
          </View>
        }
      />
    </View>
  );
}
