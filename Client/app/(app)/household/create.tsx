import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useHouseholds } from '@/hooks/useHouseholds';

interface CreateHouseholdForm {
  name: string;
}

export default function CreateHouseholdScreen() {
  const router = useRouter();
  const { createHouseholdAsync, createMutation } = useHouseholds();

  const { control, handleSubmit } = useForm<CreateHouseholdForm>({
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: CreateHouseholdForm) => {
    await createHouseholdAsync(data);
    router.back();
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      {/** Create Household Form */}

      <Text className="text-2xl font-bold mb-8">New Household</Text>

      <Text className="text-sm text-gray-500 mb-2">Household Name</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-8"
            placeholder="e.g. The Smith Family"
            value={value}
            onChangeText={onChange}
          />
        )}
      />

      {/* Display error message if household creation fails */}

      {createMutation.isError && (
        <Text className="text-red-500 mb-4">{createMutation.error?.message}</Text>
      )}

      {/* Submit button to create the household, shows loading state while the request is pending */}

      <Pressable // Button 
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={handleSubmit(onSubmit)}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Create Household</Text>
        )}
      </Pressable>
    </View>
  );
}
