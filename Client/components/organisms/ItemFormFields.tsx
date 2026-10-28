import { View, Text, TextInput } from 'react-native';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors } from 'react-hook-form';
import { PrioritySelector } from '../atoms/PrioritySelector';
import { StorePicker } from '../atoms/StorePicker';
import { Priority } from '@/types';
import type { Store } from '@/types';

// Name, priority, store, quantity and notes fields shared by the add-item and edit-item screens.
// Limits match the server's validation in Server/items/ItemControllers.py.

export interface ItemFormValues {
  name: string;
  priority: Priority;
  storeId: number | null;
  quantity: string;
  notes: string;
}

export const EMPTY_ITEM_FORM: ItemFormValues = {
  name: '',
  priority: Priority.NONE,
  storeId: null,
  quantity: '',
  notes: '',
};

const MAX_QUANTITY = 9999;

/** Form values to API fields: blank quantity/notes become null (cleared) */
export const itemFormToData = (values: ItemFormValues) => ({
  name: values.name.trim(),
  priority: values.priority,
  storeId: values.storeId,
  quantity: values.quantity.trim() ? Number(values.quantity) : null,
  notes: values.notes.trim() || null,
});

interface ItemFormFieldsProps {
  control: Control<ItemFormValues>;
  errors: FieldErrors<ItemFormValues>;
  /** The household's stores, offered in the store picker */
  stores: Store[];
}

export function ItemFormFields({ control, errors, stores }: ItemFormFieldsProps) {
  return (
    <View>
      <Text className="text-sm text-gray-500 mb-2">Item Name</Text>
      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Item name is required',
          validate: (value) => value.trim().length > 0 || 'Item name is required',
          maxLength: { value: 255, message: 'Item name must be 255 characters or fewer' },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="e.g. Milk"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-3">{errors.name?.message ?? ''}</Text>

      <Text className="text-sm text-gray-500 mb-2">Urgency</Text>
      <View className="mb-4">
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => <PrioritySelector value={value} onChange={onChange} />}
        />
      </View>

      <Text className="text-sm text-gray-500 mb-2">Store (optional)</Text>
      <View className="mb-4">
        <Controller
          control={control}
          name="storeId"
          render={({ field: { onChange, value } }) => (
            <StorePicker stores={stores} value={value} onChange={onChange} />
          )}
        />
        {stores.length === 0 && (
          <Text className="text-xs text-gray-400 mt-2">Add stores from the household screen to pick one here.</Text>
        )}
      </View>

      <Text className="text-sm text-gray-500 mb-2">Quantity (optional)</Text>
      <Controller
        control={control}
        name="quantity"
        rules={{
          validate: (value) =>
            value.trim() === '' ||
            (/^\d+$/.test(value.trim()) && Number(value) >= 1 && Number(value) <= MAX_QUANTITY) ||
            `Quantity must be a whole number from 1 to ${MAX_QUANTITY}`,
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="e.g. 2"
            keyboardType="number-pad"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-3">{errors.quantity?.message ?? ''}</Text>

      <Text className="text-sm text-gray-500 mb-2">Notes (optional)</Text>
      <Controller
        control={control}
        name="notes"
        rules={{ maxLength: { value: 1000, message: 'Notes must be 1000 characters or fewer' } }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="Any extra details..."
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-5">{errors.notes?.message ?? ''}</Text>
    </View>
  );
}
