import { useEffect } from 'react';
import { View, ScrollView, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useItems } from '@/hooks/useItems';
import { useStores } from '@/hooks/useStores';
import { useRetailers } from '@/hooks/useRetailers';
import { ItemFormFields, EMPTY_ITEM_FORM, itemFormToData } from '@/components/organisms';
import type { ItemFormValues } from '@/components/organisms';
import { storeLink } from '@/utils/storeLinks';
import { openLink } from '@/utils/openLink';

// Edit or delete an item on a shopping list
export default function ItemDetailScreen() {
  const router = useRouter();
  const { id, householdId, listId } = useLocalSearchParams<{
    id: string;
    householdId: string;
    listId: string;
  }>();
  const { items, isLoading, updateItemAsync, removeItemAsync, updateMutation, deleteMutation, isRemoving } =
    useItems(householdId, listId);
  const { stores } = useStores(householdId);
  const { retailers } = useRetailers();

  const item = items.find((i) => String(i.OHID) === id);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ItemFormValues>({
    defaultValues: EMPTY_ITEM_FORM,
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        priority: item.priority,
        storeId: item.storeId,
        quantity: item.quantity !== null ? String(item.quantity) : '',
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
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-gray-400 mb-4">Item not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-600">← Back</Text>
        </Pressable>
      </View>
    );
  }

  const onSubmit = async (values: ItemFormValues) => {
    try {
      await updateItemAsync({ itemOHID: id, data: itemFormToData(values) });
      router.back();
    } catch {
      // updateMutation.isError is now true; the error renders above the buttons
    }
  };

  const onDelete = () => {
    Alert.alert('Delete item?', `Remove "${item.name}" from this list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItemAsync(id);
            router.back();
          } catch {
            // deleteMutation.isError is now true; the error renders above the buttons
          }
        },
      },
    ]);
  };

  const errorMessage = updateMutation.error?.message ?? deleteMutation.error?.message;

  // The saved store, searched for the saved name
  const store = stores.find((s) => s.OHID === item.storeId);
  const link = store ? storeLink(store, retailers, item.name) : null;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pt-14 pb-8" keyboardShouldPersistTaps="handled">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className={`text-2xl font-bold ${link ? 'mb-4' : 'mb-8'}`}>Edit Item</Text>

      {store && link && (
        <Pressable
          accessibilityRole="link"
          className="self-start border border-blue-600 rounded-lg px-4 py-2 mb-8 active:bg-blue-50"
          onPress={() => openLink(link.url)}
        >
          <Text className="text-blue-600 font-semibold">
            {`${link.isSearch ? `Search ${store.name} for this` : `Open ${store.name}`} ↗`}
          </Text>
        </Pressable>
      )}

      <ItemFormFields control={control} errors={errors} stores={stores} />

      {errorMessage && <Text className="text-red-500 mb-4">{errorMessage}</Text>}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center mb-3 active:bg-blue-700"
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
        className="border border-red-400 rounded-lg py-3 items-center active:bg-red-50"
        onPress={onDelete}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text className="text-red-500 font-semibold text-base">Delete Item</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
