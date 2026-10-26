import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHouseholds';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';
import { MemberList } from '@/components/organisms';

export default function HouseholdMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabaseUser } = useAuth();
  const { household } = useHousehold(id);
  const { members, isLoading, error, refetch, isRefetching } = useHouseholdMembers(id);

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-4" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold">Members</Text>
      <Text className="text-sm text-gray-400 mt-1 mb-4">{household?.name}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" className="mt-12" />
      ) : error ? (
        <Text className="text-red-500 mt-6">{error.message}</Text>
      ) : (
        <MemberList
          members={members}
          currentUserId={supabaseUser?.id}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}
    </View>
  );
}
