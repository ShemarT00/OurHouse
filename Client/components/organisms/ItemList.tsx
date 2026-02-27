import { FlatList, View, Text } from 'react-native';
import { ItemCard } from '../molecules/ItemCard';
import type { Item } from '../../types';

interface ItemListProps {
  items: Item[];
  onItemPress?: (item: Item) => void;
}

export function ItemList({ items, onItemPress }: ItemListProps) {
  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-gray-400 text-base">No items yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.OHID)}
      renderItem={({ item }) => (
        <ItemCard item={item} onPress={() => onItemPress?.(item)} />
      )}
      contentContainerClassName="gap-2 p-4"
    />
  );
}
