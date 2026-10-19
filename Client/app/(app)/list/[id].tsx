import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useList } from '@/hooks/useLists';
import { useItems } from '@/hooks/useItems';
import type { Item } from '@/types';
import { PriorityBadge } from '@/components/atoms';

export default function ListDetailScreen() {
  const router = useRouter();
  const { id, householdId } = useLocalSearchParams<{ id: string; householdId: string }>();
  const { list, isLoading: listLoading } = useList(householdId, id);
  const { items, isLoading: itemsLoading, toggleItem } = useItems(householdId, id);

  if (listLoading || itemsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4">
        <Pressable className="mb-4" onPress={() => router.back()}>
          <Text className="text-blue-600">← Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold">{list?.name}</Text>
      </View>

      <View className="px-6 flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold">Items</Text>
        <Pressable
          className="bg-blue-600 px-3 py-1.5 rounded-lg"
          onPress={() =>
            router.push({ pathname: '/(app)/item/create', params: { householdId, listId: id } })
          }
        >
          <Text className="text-white text-sm font-semibold">+ Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item: Item) => String(item.OHID)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable // Each item in the list, shows a checkbox to toggle completion status and navigates to item details on press 
            className="border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
            onPress={() =>
              router.push({ pathname: '/(app)/item/[id]', params: { id: item.OHID, householdId, listId: id } }) // Navigate to item details screen on press
            }
          >
            <Pressable // Checkbox to toggle item completion status, shows a checkmark when completed and strikes through the item name
              className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                item.bought ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
              }`}
              onPress={() => toggleItem(String(item.OHID))} // Toggle item completion status when pressed
            >
              {item.bought && <Text className="text-white text-xs">✓</Text>}
            </Pressable>
            <View className="flex-1">
              <Text className={`text-base ${item.bought ? 'line-through text-gray-400' : ''}`}>
                {item.name}
              </Text>
              <View className="mt-1 self-start">
                <PriorityBadge priority={item.priority} />
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Text className="text-gray-400">No items yet. Add one!</Text>
          </View>
        }
      />
    </View>
  );
}
