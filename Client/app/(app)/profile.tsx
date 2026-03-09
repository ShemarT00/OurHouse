import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, logoutMutation } = useAuth();
  const { profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => router.replace('/(auth)/login'),
    });
  };
  
//  Main profile screen showing user's name and email, with a sign out button at the bottom
  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Text className="text-2xl font-bold mb-8">Profile</Text>

      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <Text className="text-sm text-gray-500 mb-1">Name</Text>
        <Text className="text-base font-medium">{profile?.name ?? '—'}</Text>
      </View>

      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <Text className="text-sm text-gray-500 mb-1">Email</Text>
        <Text className="text-base font-medium">{profile?.email ?? '—'}</Text>
      </View>

      <Pressable
        className="bg-red-500 rounded-lg py-3 items-center mt-auto mb-8"
        onPress={handleLogout}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign Out</Text>
        )}
      </Pressable>
    </View>
  );
}
