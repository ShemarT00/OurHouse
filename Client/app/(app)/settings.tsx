import { useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, SwitchRow } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useHouseholds } from '@/hooks/useHouseholds';

interface NameFormData {
  name: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, logoutMutation } = useAuth();
  const { profile, isLoading, updateProfileAsync, updateMutation } = useUserProfile();
  const { households, setMuted, muteError } = useHouseholds();
  const [editingName, setEditingName] = useState(false);
  const { control, handleSubmit, reset } = useForm<NameFormData>({ defaultValues: { name: '' } });

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

  const startEditingName = () => {
    updateMutation.reset();
    reset({ name: profile?.name ?? '' });
    setEditingName(true);
  };

  const saveName = async ({ name }: NameFormData) => {
    try {
      await updateProfileAsync({ name: name.trim() });
      setEditingName(false);
    } catch {
      // updateMutation.isError is now true; the error renders under the name
    }
  };

  // One section per area of settings, with Sign Out at the bottom of the page
  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="flex-grow px-6 pt-14">
      <Text className="text-2xl font-bold mb-8">Settings</Text>

      <View>
        <Text className="text-lg font-semibold mb-3">Profile</Text>

        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-gray-500">Name</Text>
            {!editingName && (
              <Pressable onPress={startEditingName}>
                <Text className="text-blue-600">Edit</Text>
              </Pressable>
            )}
          </View>
          {editingName ? (
            <View className="gap-3">
              <Controller
                control={control}
                name="name"
                rules={{
                  // Checked once trimmed, as the server does (Server/users/UserController.py)
                  validate: {
                    required: (value) => value.trim().length > 0 || 'Name is required',
                    maxLength: (value) => value.trim().length <= 255 || 'Name must be 255 characters or fewer',
                  },
                }}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message ?? (updateMutation.isError ? updateMutation.error?.message : undefined)}
                    autoFocus
                  />
                )}
              />
              <View className="flex-row gap-2">
                <Pressable
                  className="flex-1 bg-gray-200 rounded-lg py-3 items-center active:bg-gray-300"
                  onPress={() => setEditingName(false)}
                >
                  <Text className="text-gray-800 font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-blue-600 rounded-lg py-3 items-center active:bg-blue-700"
                  onPress={handleSubmit(saveName)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="text-base font-medium">{profile?.name ?? '—'}</Text>
          )}
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-sm text-gray-500 mb-1">Email</Text>
          <Text className="text-base font-medium">{profile?.email ?? '—'}</Text>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-lg font-semibold mb-1">Notifications from each household</Text>
        {households.map((household) => (
          <SwitchRow
            key={household.OHID}
            label={household.name}
            note={household.muted ? 'Muted' : undefined}
            value={!household.muted}
            onValueChange={(on) => setMuted({ OHID: household.OHID, muted: !on })}
          />
        ))}
        {muteError && <Text className="text-red-500 text-sm">{muteError.message}</Text>}
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
    </ScrollView>
  );
}
