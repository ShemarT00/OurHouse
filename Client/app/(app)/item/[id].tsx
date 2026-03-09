import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { useItems } from '@/hooks/useItems';
import { Priority } from '@/types';

interface EditItemForm {
  name: string;
  priority: Priority;
  quantity: string;
  notes: string;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id, householdId, listId } = useLocalSearchParams<{
    id: string;
    householdId: string;
    listId: string;
  }>();
  const { items, isLoading, updateItemAsync, removeItem, updateMutation, isRemoving } =
    useItems(householdId, listId);

  const item = items.find((i) => String(i.OHID) === id);

  const { control, handleSubmit, watch, setValue, reset } = useForm<EditItemForm>({
    defaultValues: { name: '', priority: 'MEDIUM', quantity: '', notes: '' },
  });

  const selectedPriority = watch('priority');

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        priority: item.priority,
        quantity: item.quantity ? String(item.quantity) : '',
        notes: item.notes ?? '',
      });
    }
  }, [item, reset]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-400">Item not found.</Text>
      </View>
    );
  }

  const onSubmit = async (data: EditItemForm) => {
    await updateItemAsync({
      itemOHID: id,
      data: {
        name: data.name,
        priority: data.priority,
        quantity: data.quantity ? Number(data.quantity) : undefined,
        notes: data.notes || undefined,
      },
    });
    router.back();
  };

  const onDelete = () => {
    removeItem(id, { onSuccess: () => router.back() });
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold mb-8">Edit Item</Text>

      <Text className="text-sm text-gray-500 mb-2">Item Name</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
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
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      {updateMutation.isError && (
        <Text className="text-red-500 mb-4">{updateMutation.error?.message}</Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center mb-3"
        onPress={handleSubmit(onSubmit)}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Save Changes</Text>
        )}
      </Pressable>

      <Pressable
        className="border border-red-400 rounded-lg py-3 items-center"
        onPress={onDelete}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text className="text-red-500 font-semibold text-base">Delete Item</Text>
        )}
      </Pressable>
    </View>
  );
}
