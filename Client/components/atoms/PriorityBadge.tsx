import { View, Text } from 'react-native';
import { Priority } from '@/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, { container: string; text: string; label: string }> = {
  [Priority.NONE]: { container: 'bg-gray-100', text: 'text-gray-600', label: 'No priority' },
  [Priority.LOW]: { container: 'bg-green-100', text: 'text-green-700', label: 'Low' },
  [Priority.MEDIUM]: { container: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
  [Priority.HIGH]: { container: 'bg-red-100', text: 'text-red-700', label: 'High' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = priorityStyles[priority];
  return (
    <View className={`rounded-full px-2 py-0.5 ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{styles.label}</Text>
    </View>
  );
}
