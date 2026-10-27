import { ScrollView, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useItems } from '@/hooks/useItems';
import { ItemFormFields, EMPTY_ITEM_FORM, itemFormToData } from '@/components/organisms';
import type { ItemFormValues } from '@/components/organisms';

// Add an item to a shopping list: name, urgency, quantity and notes
export default function CreateItemScreen() {
  const router = useRouter();
  const { householdId, listId } = useLocalSearchParams<{ householdId: string; listId: string }>();
  const { addItemAsync, createMutation } = useItems(householdId, listId);

  const { control, handleSubmit, formState: { errors } } = useForm<ItemFormValues>({
    defaultValues: EMPTY_ITEM_FORM,
  });

  const onSubmit = async (values: ItemFormValues) => {
    try {
      await addItemAsync(itemFormToData(values));
      router.back();
    } catch {
      // createMutation.isError is now true; the error renders above the button
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 pt-14 pb-8" keyboardShouldPersistTaps="handled">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold mb-8">Add Item</Text>

      <ItemFormFields control={control} errors={errors} />

      {createMutation.isError && (
        <Text className="text-red-500 mb-4">{createMutation.error?.message}</Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center active:bg-blue-700"
        onPress={handleSubmit(onSubmit)}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Add Item</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
