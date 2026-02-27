import { View, Text, TouchableOpacity } from 'react-native';
import { PriorityBadge } from '../atoms/PriorityBadge';
import type { Item } from '../../types';

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100"
    >
      <Text className="text-base font-medium text-gray-900 flex-1 mr-3">{item.name}</Text>
      <PriorityBadge priority={item.priority} />
    </TouchableOpacity>
  );
}
