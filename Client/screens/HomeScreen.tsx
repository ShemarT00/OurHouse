import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Household } from '../types';
import { Button } from '../components/atoms';
import { router } from 'expo-router';

const HomeScreen: React.FC = () => {
  const { data: households, isLoading } = useQuery<Household[]>({
    queryKey: ['households'],
    queryFn: async () => {
      // TODO: fetch households from API
      return [];
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-8 pb-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">My Households</Text>
        <Button label="+ New" onPress={() => {/* TODO: navigate to CreateHouseholdScreen */ router.push({ pathname: `/(app)/create-household` })}} />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={households}
          keyExtractor={(item) => item.OHID.toString()}
          contentContainerClassName="px-4 gap-3 pb-8"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400 text-base">No households yet.</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Create one or ask to be invited.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              onPress={() => {/* TODO: navigate to HouseholdScreen */         router.push({ pathname: `/(app)/household/${item.OHID}` })}}
            >
              <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;
