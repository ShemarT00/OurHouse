import { View, Text, Pressable } from 'react-native';
import type { Priority } from '../../types';

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

const priorityStyles: Record<Priority, { active: string; activeText: string; label: string }> = {
  LOW: { active: 'bg-green-500 border-green-500', activeText: 'text-white', label: 'Low' },
  MEDIUM: { active: 'bg-yellow-500 border-yellow-500', activeText: 'text-white', label: 'Medium' },
  HIGH: { active: 'bg-red-500 border-red-500', activeText: 'text-white', label: 'High' },
};

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <View className="flex-row gap-2">
      {PRIORITIES.map((p) => {
        const styles = priorityStyles[p];
        const isSelected = value === p;
        return (
          <Pressable
            key={p}
            className={`flex-1 py-2 rounded-lg border items-center ${
              isSelected ? styles.active : 'border-gray-300'
            }`}
            onPress={() => onChange(p)}
          >
            <Text className={`text-sm font-medium ${isSelected ? styles.activeText : 'text-gray-600'}`}>
              {styles.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
