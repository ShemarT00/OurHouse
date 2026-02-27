import { View, Text, TouchableOpacity } from 'react-native';
import type { ShoppingList } from '../../types';

interface ListCardProps {
  list: ShoppingList;
  itemCount?: number;
  onPress?: () => void;
}

export function ListCard({ list, itemCount = 0, onPress }: ListCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
    >
      <Text className="text-lg font-semibold text-gray-900">{list.name}</Text>
      <Text className="text-sm text-gray-500 mt-1">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
}
