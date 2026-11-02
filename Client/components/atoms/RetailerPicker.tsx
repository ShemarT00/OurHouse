import { View, Text, Pressable } from 'react-native';
import type { Retailer } from '@/types';

// Choose which retailer a store is linked to, or none. Retired retailers are never offered.
interface RetailerPickerProps {
  retailers: Retailer[];
  value: string | null;
  onChange: (retailer: Retailer | null) => void;
}

export function RetailerPicker({ retailers, value, onChange }: RetailerPickerProps) {
  const options = [
    { key: null, name: 'No retailer', retailer: null },
    ...retailers.filter((r) => !r.retired).map((r) => ({ key: r.key, name: r.name, retailer: r })),
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.key;
        return (
          <Pressable
            key={option.key ?? 'none'}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            className={`px-3 py-2 rounded-lg border ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
            onPress={() => onChange(option.retailer)}
          >
            <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>
              {option.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
