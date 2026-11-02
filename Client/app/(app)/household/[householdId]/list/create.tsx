import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useLists } from '@/hooks/useLists';

interface CreateListForm {
  name: string;
}

export default function CreateListScreen() {
  const router = useRouter();
  const { householdId } = useLocalSearchParams<{ householdId: string }>();
  const { createListAsync, createMutation } = useLists(householdId);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateListForm>({
    defaultValues: { name: '' },
  });

  // Create the list, then return to the household, whose list of lists refreshes
  const onSubmit = async (data: CreateListForm) => {
    try {
      await createListAsync({ name: data.name.trim() });
      router.back();
    } catch {
      // createMutation.isError is now true; the error renders above the button
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold mb-8">New Shopping List</Text>

      <Text className="text-sm text-gray-500 mb-2">List Name</Text>
      <Controller
        control={control}
        name="name"
        rules={{
          required: 'List name is required',
          validate: (value) => value.trim().length > 0 || 'List name is required',
          maxLength: { value: 255, message: 'List name must be 255 characters or fewer' },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="e.g. Weekly Groceries"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-7">{errors.name?.message ?? ''}</Text>

      {createMutation.isError && ( // Display error message if list creation fails
        <Text className="text-red-500 mb-4">{createMutation.error?.message}</Text>
      )}

      <Pressable // Submit button to create the list, shows loading state while the request is pending
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={handleSubmit(onSubmit)}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Create List</Text>
        )}
      </Pressable>
    </View>
  );
}
