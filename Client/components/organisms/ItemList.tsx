import { FlatList, View, Text } from 'react-native';
import { ItemCard } from '../molecules/ItemCard';
import { storeLink } from '@/utils/storeLinks';
import type { Item, Retailer, Store } from '@/types';

// Items on a shopping list; tapping opens the item, the checkbox ticks it off,
// and a linked store opens its search for the item (or its homepage)
interface ItemListProps {
  items: Item[];
  /** The household's stores, to show each item's store by name */
  stores?: Store[];
  /** Retailers still offered, to build each store's link */
  retailers?: Retailer[];
  onItemPress?: (item: Item) => void;
  onToggleBought?: (item: Item) => void;
  /** Opens a store's link, e.g. with expo-linking */
  onOpenStore?: (url: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Shown instead of the empty state, e.g. when items failed to load */
  errorMessage?: string;
}

export function ItemList({
  items, stores = [], retailers = [], onItemPress, onToggleBought, onOpenStore, refreshing, onRefresh, errorMessage,
}: ItemListProps) {
  const storesById = new Map(stores.map((s) => [s.OHID, s]));

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.OHID)}
      renderItem={({ item }) => {
        const store = item.storeId !== null ? storesById.get(item.storeId) : undefined;
        const link = store && onOpenStore ? storeLink(store, retailers, item.name) : null;
        return (
          <ItemCard
            item={item}
            storeName={store?.name}
            onOpenStore={link ? () => onOpenStore?.(link.url) : undefined}
            onPress={() => onItemPress?.(item)}
            onToggleBought={() => onToggleBought?.(item)}
          />
        );
      }}
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
