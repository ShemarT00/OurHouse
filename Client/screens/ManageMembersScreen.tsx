import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Member } from '../types';
import { Button } from '../components/atoms';

interface ManageMembersScreenProps {
  householdId: number;
}

const ManageMembersScreen: React.FC<ManageMembersScreenProps> = ({ householdId }) => {
  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ['members', householdId],
    queryFn: async () => {
      // TODO: fetch members from API
      return [];
    },
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-8 pb-4 flex-row justify-between items-center">
        <Text className="text-2xl font-bold">Members</Text>
        <Button label="Invite" onPress={() => {/* TODO: show invite flow */}} />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.OHID.toString()}
          contentContainerClassName="px-4 gap-3 pb-8"
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-gray-400 text-base">No members yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl px-4 py-3 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="font-semibold text-base">
                  {item.firstName} {item.lastName}
                </Text>
                <Text className="text-gray-400 text-sm">Member</Text>
              </View>
              <Button
                label="Remove"
                onPress={() => {/* TODO: remove member */}}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default ManageMembersScreen;
