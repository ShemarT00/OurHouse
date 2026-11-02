import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useList } from '@/hooks/useLists';
import { useItems, useLiveItems } from '@/hooks/useItems';
import { useStores } from '@/hooks/useStores';
import { useRetailers } from '@/hooks/useRetailers';
import { openLink } from '@/utils/openLink';
import { ItemList } from '@/components/organisms';

export default function ListDetailScreen() {
  const router = useRouter();
  const { id, householdId } = useLocalSearchParams<{ id: string; householdId: string }>();
  const { list, isLoading: listLoading } = useList(householdId, id);
  const { items, isLoading: itemsLoading, error, toggleItem, refetch, isRefetching } = useItems(householdId, id);
  const { stores } = useStores(householdId);
  const { retailers } = useRetailers();
  useLiveItems(householdId, id);

  if (listLoading || itemsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const stillNeeded = items.filter((item) => !item.bought).length;

  return (
    <View className="flex-1 bg-white">
      <View className="px-6 pt-14 pb-4">
        <Pressable className="mb-4" onPress={() => router.back()}>
          <Text className="text-blue-600">← Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold">{list?.name}</Text>
        <Text className="text-sm text-gray-400 mt-1">
          {items.length === 0 ? 'Nothing on this list yet' : `${stillNeeded} of ${items.length} still needed`}
        </Text>
      </View>

      <View className="px-6 flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold">Items</Text>
        <Pressable
          className="bg-blue-600 px-3 py-1.5 rounded-lg active:bg-blue-700"
          onPress={() => router.push({ pathname: '/(app)/item/create', params: { householdId, listId: id } })}
        >
          <Text className="text-white text-sm font-semibold">+ Add Item</Text>
        </Pressable>
      </View>

      <ItemList
        items={items}
        stores={stores}
        retailers={retailers}
        onItemPress={(item) =>
          router.push({ pathname: '/(app)/item/[id]', params: { id: item.OHID, householdId, listId: id } })
        }
        onToggleBought={(item) => toggleItem(String(item.OHID))}
        onOpenStore={openLink}
        refreshing={isRefetching}
        onRefresh={refetch}
        errorMessage={error?.message}
      />
    </View>
  );
}
