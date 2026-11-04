import { View, Text, Switch } from 'react-native';

export interface SwitchRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Short note under the label, e.g. "Muted" */
  note?: string;
}

/** One setting that is on or off; the switch is labelled with the row's label */
export function SwitchRow({ label, value, onValueChange, note }: SwitchRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 mr-4">
        <Text className="text-base font-medium">{label}</Text>
        {note ? <Text className="text-sm text-gray-500">{note}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} />
    </View>
  );
}
