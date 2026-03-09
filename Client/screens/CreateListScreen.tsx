import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextInput } from '../components/atoms';

interface CreateListFormData {
  name: string;
}

interface CreateListScreenProps {
  householdId: number;
}

const CreateListScreen: React.FC<CreateListScreenProps> = ({ householdId }) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateListFormData>();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateListFormData) => {
      // TODO: call API to create shopping list
      
      console.log({ ...data, householdId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shoppingLists', householdId] });
      // TODO: navigate back to HouseholdScreen
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-10 pb-6">
        <Text className="text-2xl font-bold mb-1">New List</Text>
        <Text className="text-gray-500 mb-8">
          Create a new shopping list for your household.
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'List name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="e.g. Weekly Groceries"
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <View className="mt-6">
          <Button
            label={isPending ? 'Creating...' : 'Create List'}
            onPress={handleSubmit((data) => mutate(data))}
            disabled={isPending}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateListScreen;
