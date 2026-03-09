import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Priority } from '../types';
import { Button, TextInput, PriorityBadge } from '../components/atoms';

interface AddItemFormData {
  name: string;
  priority: Priority;
  quantity?: number;
  notes?: string;
}

interface AddItemScreenProps {
  listId: number;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

const AddItemScreen: React.FC<AddItemScreenProps> = ({ listId }) => {
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
    mutationFn: async (data: AddItemFormData) => {
      // TODO: call API to add item (triggers notification to other members)
      console.log({ ...data, listId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
      // TODO: navigate back to ListDetailScreen
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
        <View className="flex-row gap-2 mb-4">
          {PRIORITIES.map((p) => (
            <PriorityBadge
              key={p}
              priority={p}
              selected={selectedPriority === p}
              onPress={() => setValue('priority', p)}
            />
          ))}
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

        <Button
          label={isPending ? 'Adding...' : 'Add Item'}
          onPress={handleSubmit((data) => mutate(data))}
          disabled={isPending}
          className="mt-6"
        />
      </View>
    </ScrollView>
  );
};

export default AddItemScreen;
