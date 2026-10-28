import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useHousehold } from '@/hooks/useHouseholds';
import { useStores } from '@/hooks/useStores';
import type { Store } from '@/types';

interface AddStoreForm {
  name: string;
}

// A household's stores, with a field to add another
export default function HouseholdStoresScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { household } = useHousehold(id);
  const { stores, isLoading, error, refetch, isRefetching, createStoreAsync, createMutation } = useStores(id);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AddStoreForm>({
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: AddStoreForm) => {
    try {
      await createStoreAsync({ name: data.name.trim() });
      reset();
    } catch {
      // createMutation.isError is now true; the error renders under the field
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-4" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold">Stores</Text>
      <Text className="text-sm text-gray-400 mt-1 mb-6">{household?.name}</Text>

      <View className="flex-row gap-2">
        <Controller
          control={control}
          name="name"
          rules={{
            required: 'Store name is required',
            validate: (value) => value.trim().length > 0 || 'Store name is required',
            maxLength: { value: 255, message: 'Store name must be 255 characters or fewer' },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
              placeholder="e.g. Tesco"
              value={value}
              onChangeText={onChange}
              onSubmitEditing={handleSubmit(onSubmit)}
              returnKeyType="done"
            />
          )}
        />
        <Pressable
          className="bg-blue-600 rounded-lg px-4 justify-center active:bg-blue-700"
          onPress={handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Add</Text>
          )}
        </Pressable>
      </View>
      <Text className="text-red-500 text-sm mt-1 mb-4">
        {errors.name?.message ?? (createMutation.isError ? createMutation.error?.message : '')}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" className="mt-12" />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(store: Store) => String(store.OHID)}
          contentContainerClassName="gap-2 pb-6"
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-xl p-4">
              <Text className="text-base font-medium">{item.name}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-12">
              {error ? (
                <Text className="text-red-500">{error.message}</Text>
              ) : (
                <Text className="text-gray-400">No stores yet. Add the places you shop.</Text>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
