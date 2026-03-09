import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShoppingList } from '../types';
import { ListCard } from '../components/molecules';
import { Button } from '../components/atoms';

interface HouseholdScreenProps {
  householdId: number;
}

const HouseholdScreen: React.FC<HouseholdScreenProps> = ({ householdId }) => {
  const { data: lists, isLoading } = useQuery<ShoppingList[]>({
    queryKey: ['shoppingLists', householdId],
    queryFn: async () => {
      // TODO: fetch shopping lists for household from API
      return [];
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-8 pb-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">Shopping Lists</Text>
        <View className="flex-row gap-2">
          <Button
            label="Members"
            onPress={() => {/* TODO: navigate to ManageMembersScreen */}}
          />
          <Button
            label="+ List"
            onPress={() => {/* TODO: navigate to CreateListScreen */}}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.OHID.toString()}
          contentContainerClassName="px-4 gap-3 pb-8"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400 text-base">No lists yet.</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Tap "+ List" to create one.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListCard
              list={item}
              onPress={() => {/* TODO: navigate to ListDetailScreen */}} // Each list card navigates to the list details screen when pressed  
            />
          )}
        />
      )}
    </View>
  );
};

export default HouseholdScreen;
