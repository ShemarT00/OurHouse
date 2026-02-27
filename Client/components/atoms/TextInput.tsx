import { TextInput as RNTextInput, View, Text, TextInputProps as RNTextInputProps } from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, className, ...props }: TextInputProps) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <RNTextInput
        className={`border rounded-lg px-3 py-2 text-base text-gray-900 ${error ? 'border-red-500' : 'border-gray-300'} ${className ?? ''}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}
