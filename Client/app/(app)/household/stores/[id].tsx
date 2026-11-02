import { useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { StoreCard, StoreFormFields, EMPTY_STORE_FORM, storeFormToData, storeToForm } from '@/components';
import type { StoreFormValues } from '@/components';
import { useHousehold } from '@/hooks/useHouseholds';
import { useStores } from '@/hooks/useStores';
import { useRetailers } from '@/hooks/useRetailers';
import { storeLink } from '@/utils/storeLinks';
import { openLink } from '@/utils/openLink';
import type { Store } from '@/types';

// A household's stores, with a form to add one or edit the one being edited.
// Tapping a linked store opens its homepage.
export default function HouseholdStoresScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { household } = useHousehold(id);
  const {
    stores, isLoading, error, refetch, isRefetching,
    createStoreAsync, createMutation, updateStoreAsync, updateMutation,
  } = useStores(id);
  const { retailers } = useRetailers();
  const [editing, setEditing] = useState<Store | null>(null);

  const form = useForm<StoreFormValues>({ defaultValues: EMPTY_STORE_FORM });
  const mutation = editing ? updateMutation : createMutation;

  const startEditing = (store: Store) => {
    updateMutation.reset();
    setEditing(store);
    form.reset(storeToForm(store));
  };

  const stopEditing = () => {
    createMutation.reset();
    setEditing(null);
    form.reset(EMPTY_STORE_FORM);
  };

  const onSubmit = async (values: StoreFormValues) => {
    const data = storeFormToData(values, retailers);
    try {
      if (editing) {
        await updateStoreAsync({ storeId: editing.OHID, data });
      } else {
        await createStoreAsync(data);
      }
      stopEditing();
    } catch {
      // mutation.isError is now true; the error renders under the name
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-4" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold">Stores</Text>
      <Text className="text-sm text-gray-400 mt-1 mb-6">{household?.name}</Text>

      {editing && <Text className="text-base font-semibold mb-3">{`Editing ${editing.name}`}</Text>}
      <StoreFormFields
        form={form}
        retailers={retailers}
        serverError={mutation.isError ? mutation.error?.message : undefined}
      />
      <View className="flex-row gap-2 mb-6">
        {editing && (
          <Pressable
            className="flex-1 bg-gray-200 rounded-lg py-3 items-center active:bg-gray-300"
            onPress={stopEditing}
          >
            <Text className="text-gray-800 font-semibold">Cancel</Text>
          </Pressable>
        )}
        <Pressable
          className="flex-1 bg-blue-600 rounded-lg py-3 items-center active:bg-blue-700"
          onPress={form.handleSubmit(onSubmit)}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">{editing ? 'Save' : 'Add'}</Text>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" className="mt-12" />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(store: Store) => String(store.OHID)}
          contentContainerClassName="gap-2 pb-6"
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const link = storeLink(item, retailers);
            return (
              <StoreCard
                store={item}
                retailer={retailers.find((r) => r.key === item.retailerKey)}
                onOpen={link ? () => openLink(link.url) : undefined}
                onEdit={() => startEditing(item)}
              />
            );
          }}
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
