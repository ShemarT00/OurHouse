import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextInput } from '../components/atoms';

interface CreateHouseholdFormData {
  name: string;
}

const CreateHouseholdScreen: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateHouseholdFormData>();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateHouseholdFormData) => {
      // TODO: call API to create household
      console.log(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      // TODO: navigate back to HomeScreen
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-10 pb-6">
        <Text className="text-2xl font-bold mb-1">New Household</Text>
        <Text className="text-gray-500 mb-8">
          Give your household a name to get started.
        </Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Household name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="e.g. The Smith House"
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Button
          label={isPending ? 'Creating...' : 'Create Household'}
          onPress={handleSubmit((data) => mutate(data))}
          disabled={isPending}
          className="mt-6"
        />
      </View>
    </ScrollView>
  );
};

export default CreateHouseholdScreen;
