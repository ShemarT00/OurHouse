import { View, Text, Pressable } from 'react-native';
import type { Retailer, Store } from '@/types';

// One of a household's stores, with what it links to and a button to edit it
interface StoreCardProps {
  store: Store;
  /** The retailer the store is linked to, if it is still offered */
  retailer?: Retailer;
  onEdit: () => void;
}

const linkLabel = (store: Store, retailer?: Retailer): string => {
  if (retailer) return `Shops at ${retailer.name}`;
  if (store.website) return store.website.replace(/^https?:\/\//i, '');
  return 'No link';
};

export function StoreCard({ store, retailer, onEdit }: StoreCardProps) {
  return (
    <View className="flex-row items-center border border-gray-200 rounded-xl p-4">
      <View className="flex-1">
        <Text className="text-base font-medium">{store.name}</Text>
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{linkLabel(store, retailer)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${store.name}`}
        className="px-3 py-2 rounded-lg active:bg-gray-100"
        onPress={onEdit}
      >
        <Text className="text-blue-600 font-medium">Edit</Text>
      </Pressable>
    </View>
  );
}
