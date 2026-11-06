import { View, Text } from 'react-native';

type TagVariant = 'neutral' | 'info';

export interface TagProps {
  label: string;
  variant?: TagVariant;
}

const tagStyles: Record<TagVariant, { container: string; text: string }> = {
  neutral: { container: 'bg-gray-100', text: 'text-gray-600' },
  info: { container: 'bg-blue-100', text: 'text-blue-700' },
};

/** A small rounded label beside a name, e.g. "Muted" on a household or "Admin" on a member */
export function Tag({ label, variant = 'neutral' }: TagProps) {
  const styles = tagStyles[variant];
  return (
    <View className={`rounded-full px-2 py-0.5 ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  );
}
