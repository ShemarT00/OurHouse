import { View, Text, Pressable } from 'react-native';
import { PriorityBadge } from '../atoms/PriorityBadge';
import type { Item } from '@/types';

// One item on a shopping list: bought checkbox, name, quantity, notes and urgency badge
interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onToggleBought?: () => void;
}

export function ItemCard({ item, onPress, onToggleBought }: ItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 flex-row items-center border border-gray-200 active:bg-gray-50"
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.bought }}
        accessibilityLabel={`Mark ${item.name} as ${item.bought ? 'still needed' : 'bought'}`}
        hitSlop={8}
        onPress={onToggleBought}
        className={`w-6 h-6 rounded border mr-3 items-center justify-center ${
          item.bought ? 'bg-blue-600 border-blue-600' : 'border-gray-400'
        }`}
      >
        {item.bought && <Text className="text-white text-xs">✓</Text>}
      </Pressable>

      <View className="flex-1 mr-3">
        <Text className={`text-base font-medium ${item.bought ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {item.name}
          {item.quantity !== null && <Text className="text-gray-500 font-normal">{`  × ${item.quantity}`}</Text>}
        </Text>
        {item.notes && (
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>

      <PriorityBadge priority={item.priority} />
    </Pressable>
  );
}
