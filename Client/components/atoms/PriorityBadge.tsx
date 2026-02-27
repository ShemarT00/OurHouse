import { View, Text } from 'react-native';
import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, { container: string; text: string; label: string }> = {
  LOW: { container: 'bg-green-100', text: 'text-green-700', label: 'Low' },
  MEDIUM: { container: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  HIGH: { container: 'bg-red-100', text: 'text-red-700', label: 'High' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = priorityStyles[priority];
  return (
    <View className={`rounded-full px-2 py-0.5 ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{styles.label}</Text>
    </View>
  );
}
