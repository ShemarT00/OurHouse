import { FlatList, View, Text } from 'react-native';
import { ItemCard } from '../molecules/ItemCard';
import type { Item } from '@/types';

// Items on a shopping list; tapping opens the item, the checkbox ticks it off
interface ItemListProps {
  items: Item[];
  onItemPress?: (item: Item) => void;
  onToggleBought?: (item: Item) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Shown instead of the empty state, e.g. when items failed to load */
  errorMessage?: string;
}

export function ItemList({ items, onItemPress, onToggleBought, refreshing, onRefresh, errorMessage }: ItemListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.OHID)}
      renderItem={({ item }) => (
        <ItemCard
          item={item}
          onPress={() => onItemPress?.(item)}
          onToggleBought={() => onToggleBought?.(item)}
        />
      )}
      contentContainerClassName="gap-2 px-6 pb-6"
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View className="items-center py-12">
          {errorMessage ? (
            <Text className="text-red-500 text-base">{errorMessage}</Text>
          ) : (
            <Text className="text-gray-400 text-base">No items yet. Add one!</Text>
          )}
        </View>
      }
    />
  );
}
