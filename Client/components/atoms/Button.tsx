import { TouchableOpacity, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-blue-600 active:bg-blue-700', text: 'text-white' },
  secondary: { container: 'bg-gray-200 active:bg-gray-300', text: 'text-gray-800' },
  danger: { container: 'bg-red-600 active:bg-red-700', text: 'text-white' },
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg px-4 py-3 items-center ${styles.container} ${disabled ? 'opacity-50' : ''}`}
    >
      <Text className={`font-semibold text-base ${styles.text}`}>{label}</Text>
    </TouchableOpacity>
  );
}
