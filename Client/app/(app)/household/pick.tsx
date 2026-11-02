import { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import type { Href } from 'expo-router';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useLists } from '@/hooks/useLists';
import { NEW_HOUSEHOLD, JOIN_HOUSEHOLD, newListRoute, newItemRoute, FROM_OUTSIDE_HOUSEHOLD } from '@/navigation/routes';
import type { Household, ShoppingList } from '@/types';

// The Menu's List and Item shortcuts: choose where the new list (next=list) or
// item (next=item) goes
export default function PickScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next: 'list' | 'item' }>();
  const { households, isLoading: householdsLoading } = useHouseholds();
  const [household, setHousehold] = useState<Household | null>(null);
  const { lists, isLoading: listsLoading } = useLists(household ? String(household.OHID) : '');

  // The picker (and whatever household was open beneath it) is left behind, so the
  // new screen has only its own household and list beneath it
  const leavePickerFor = (href: Href) => {
    router.dismissAll();
    router.push(href, FROM_OUTSIDE_HOUSEHOLD);
  };

  const openNewList = (chosen: Household) => leavePickerFor(newListRoute(chosen.OHID));

  const chooseList = (chosen: Household, list: ShoppingList) =>
    leavePickerFor(newItemRoute(chosen.OHID, list.OHID));

  const chooseHousehold = (chosen: Household) => {
    if (next === 'item') {
      setHousehold(chosen);
    } else {
      openNewList(chosen);
    }
  };

  // A Member with only one household, or a household with only one list, has nothing to
  // choose. Each step is skipped once (data fetched again must not navigate again), and
  // only once the picker is showing: until then there is no picker to leave behind.
  const skipped = useRef({ household: false, list: false });
  useFocusEffect(
    useCallback(() => {
      if (households.length === 1 && !skipped.current.household) {
        skipped.current.household = true;
        chooseHousehold(households[0]);
      } else if (household && lists.length === 1 && !skipped.current.list) {
        skipped.current.list = true;
        chooseList(household, lists[0]);
      }
    }, [households, household, lists])
  );

  // From choosing a list, Back returns to choosing a household, unless there was only one
  const goBack = () => {
    if (household && households.length > 1) {
      setHousehold(null);
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-4" onPress={goBack}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>
      <Text className="text-2xl font-bold">{next === 'item' ? 'Add Item' : 'New Shopping List'}</Text>
      <Text className="text-sm text-gray-400 mt-1 mb-6">
        {household ? `Choose a shopping list in ${household.name}` : 'Choose a household'}
      </Text>

      {(household ? listsLoading : householdsLoading) ? (
        <ActivityIndicator size="large" className="mt-12" />
      ) : household ? (
        <FlatList
          data={lists}
          keyExtractor={(list: ShoppingList) => String(list.OHID)}
          renderItem={({ item }) => (
            <Pressable className="border border-gray-200 rounded-xl p-4 mb-3" onPress={() => chooseList(household, item)}>
              <Text className="text-lg font-semibold">{item.name}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center mt-12 gap-3">
              <Text className="text-gray-400 text-base">No shopping lists yet</Text>
              <Pressable
                className="bg-blue-600 px-4 py-2 rounded-lg active:bg-blue-700"
                onPress={() => openNewList(household)}
              >
                <Text className="text-white font-semibold">New List</Text>
              </Pressable>
            </View>
          }
        />
      ) : (
        <FlatList
          data={households}
          keyExtractor={(h: Household) => String(h.OHID)}
          renderItem={({ item }) => (
            <Pressable className="border border-gray-200 rounded-xl p-4 mb-3" onPress={() => chooseHousehold(item)}>
              <Text className="text-lg font-semibold">{item.name}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            // Replaces the picker, which would have nothing to offer once Back returns to it
            <View className="items-center mt-12 gap-3">
              <Text className="text-gray-400 text-base">No households yet.</Text>
              <Pressable
                className="bg-blue-600 px-4 py-2 rounded-lg active:bg-blue-700"
                onPress={() => router.replace(NEW_HOUSEHOLD)}
              >
                <Text className="text-white font-semibold">Create Household</Text>
              </Pressable>
              <Pressable
                className="border border-blue-600 px-4 py-2 rounded-lg active:bg-blue-50"
                onPress={() => router.replace(JOIN_HOUSEHOLD)}
              >
                <Text className="text-blue-600 font-semibold">Join Household</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}
