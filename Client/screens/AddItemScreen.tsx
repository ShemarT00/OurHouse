import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Priority } from '../types';
import { Button, TextInput, PrioritySelector } from '../components/atoms';
import { createItem } from '../services/item';
import { itemsKey } from '../hooks/useItems';

interface AddItemFormData {
  name: string;
  priority: Priority;
  quantity?: number;
  notes?: string;
}

interface AddItemScreenProps {
  householdId: string;
  listId: string;
}

const AddItemScreen: React.FC<AddItemScreenProps> = ({ householdId, listId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddItemFormData>({ defaultValues: { priority: 'MEDIUM' } });

  const selectedPriority = watch('priority');

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AddItemFormData) =>
      createItem(householdId, listId, {
        name: data.name,
        priority: data.priority,
        quantity: data.quantity,
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKey(householdId, listId) });
      router.back();
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-10 pb-6">
        <Text className="text-2xl font-bold mb-1">Add Item</Text>
        <Text className="text-gray-500 mb-8">
          Add a new item to the list.
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Item name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Item name"
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">Priority</Text>
        <View className="mb-4">
          <PrioritySelector // Custom component to select priority, updates form state on selection
            value={selectedPriority}
            onChange={(p) => setValue('priority', p)}
          />
        </View>

        <Controller
          control={control}
          name="quantity"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Quantity (optional)"
              onChangeText={(v) => onChange(v ? Number(v) : undefined)}
              value={value?.toString()}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Notes (optional)"
              onChangeText={onChange}
              value={value}
              multiline
            />
          )}
        />

        <View className="mt-6">
          <Button
            label={isPending ? 'Adding...' : 'Add Item'}
            onPress={handleSubmit((data) => mutate(data))}
            disabled={isPending}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default AddItemScreen;
