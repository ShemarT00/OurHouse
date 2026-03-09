import { FlatList, View, Text } from 'react-native';
import { ItemCard } from '../molecules/ItemCard';
import type { Item } from '../../types';

interface ItemListProps {
  items: Item[];
  onItemPress?: (item: Item) => void; // Optional callback when an item is pressed, used to navigate to item details or edit screen
}


// Component to display a list of items in a shopping list, used in the shopping list details screen. Each item is rendered using the ItemCard component, and tapping an item triggers the onItemPress callback with the item data.


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
