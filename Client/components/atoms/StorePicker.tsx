import { View, Text, Pressable } from 'react-native';
import type { Store } from '@/types';

// Choose which of the household's stores an item is bought from, or none
interface StorePickerProps {
  stores: Store[];
  value: number | null;
  onChange: (storeId: number | null) => void;
}

export function StorePicker({ stores, value, onChange }: StorePickerProps) {
  const options = [{ id: null, name: 'Any store' }, ...stores.map((s) => ({ id: s.OHID, name: s.name }))];

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <Pressable
            key={option.id ?? 'none'}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            className={`px-3 py-2 rounded-lg border ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
            onPress={() => onChange(option.id)}
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
