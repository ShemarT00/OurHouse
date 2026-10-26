import { View, Text, FlatList, Pressable, ActivityIndicator, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHousehold } from '@/hooks/useHouseholds';
import { useLists } from '@/hooks/useLists';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import type { ShoppingList } from '@/types';

export default function HouseholdDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { household, isLoading: householdLoading } = useHousehold(id);
  const { lists, isLoading: listsLoading } = useLists(id);
  const { members } = useHouseholdMembers(id);

  const shareInviteCode = () => {
    if (!household) return;
    Share.share({
      message: `Join my household "${household.name}" on OurHouse with invite code ${household.inviteCode}`,
    });
  };

 /* Show loading indicator while household or lists are being fetched */

  if (householdLoading || listsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* Main content showing household details, list of shopping lists, and member count */

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4">
        <Pressable className="mb-4" onPress={() => router.back()}>
          <Text className="text-blue-600">← Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold">{household?.name}</Text>
        <Pressable
          onPress={() => router.push({ pathname: '/(app)/household/members/[id]', params: { id } })}
        >
          <Text className="text-sm text-blue-600 mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} ›
          </Text>
        </Pressable>
      </View>

      {household && (
        <View className="mx-6 mb-6 bg-blue-50 rounded-xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-gray-500 mb-1">Invite code</Text>
            <Text className="text-2xl font-bold tracking-widest font-mono">{household.inviteCode}</Text>
          </View>
          <Pressable className="bg-blue-600 px-4 py-2 rounded-lg active:bg-blue-700" onPress={shareInviteCode}>
            <Text className="text-white font-semibold">Share</Text>
          </Pressable>
        </View>
      )}

      <View className="px-6 flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold">Shopping Lists</Text>
        <Pressable
          className="bg-blue-600 px-3 py-1.5 rounded-lg"
          onPress={() => router.push({ pathname: '/(app)/list/create', params: { householdId: id } })}
        >
          <Text className="text-white text-sm font-semibold">+ New List</Text>
        </Pressable>
      </View>

      <FlatList // List of shopping lists in the household, navigates to list details on press
        data={lists}
        keyExtractor={(item: ShoppingList) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            className="border border-gray-200 rounded-xl p-4 mb-3"
            onPress={() =>
              router.push({ pathname: '/(app)/list/[id]', params: { id: item.OHID, householdId: id } })
            }
          >
            <Text className="text-base font-medium">{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Text className="text-gray-400">No lists yet. Create one!</Text>
          </View>
        }
      />
    </View>
  );
}
