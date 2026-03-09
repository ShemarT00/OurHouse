import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useItems } from '@/hooks/useItems';
import { Priority } from '@/types';

/* Form data structure for creating a new item, includes name, priority, quantity, and notes */

interface CreateItemForm {
  name: string;
  priority: Priority;
  quantity: string;
  notes: string;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH']; // Available priority options for items

/* Screen component for creating a new item in a shopping list, includes form handling and submission logic */

export default function CreateItemScreen() { 
  const router = useRouter(); // Router for navigation
  const { householdId, listId } = useLocalSearchParams<{ householdId: string; listId: string }>(); // Get householdId and listId from route parameters
  const { addItemAsync, createMutation } = useItems(householdId, listId); // Hook for managing items, provides function to add item and mutation state

  // Form handling using react-hook-form, sets up default values and tracks form state
  const { control, handleSubmit, watch, setValue } = useForm<CreateItemForm>({
    defaultValues: { name: '', priority: 'MEDIUM', quantity: '', notes: '' },
  });

  const selectedPriority = watch('priority'); // Watch the priority field to update UI based on selected priority

  const onSubmit = async (data: CreateItemForm) => {
    await addItemAsync({
      name: data.name,
      priority: data.priority,
      quantity: data.quantity ? Number(data.quantity) : undefined,
      notes: data.notes || undefined,
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold mb-8">Add Item</Text>

      <Text className="text-sm text-gray-500 mb-2">Item Name</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            placeholder="e.g. Milk"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Text className="text-sm text-gray-500 mb-2">Priority</Text>
      <View className="flex-row gap-2 mb-4">
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            className={`flex-1 py-2 rounded-lg border items-center ${
              selectedPriority === p ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
            }`}
            onPress={() => setValue('priority', p)}
          >
            <Text className={selectedPriority === p ? 'text-white font-semibold' : 'text-gray-600'}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm text-gray-500 mb-2">Quantity (optional)</Text>
      <Controller
        control={control}
        name="quantity"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            placeholder="e.g. 2"
            keyboardType="numeric"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      <Text className="text-sm text-gray-500 mb-2">Notes (optional)</Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-8"
            placeholder="Any extra details..."
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      {createMutation.isError && (
        <Text className="text-red-500 mb-4">{createMutation.error?.message}</Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={handleSubmit(onSubmit)}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Add Item</Text>
        )}
      </Pressable>
    </View>
  );
}
