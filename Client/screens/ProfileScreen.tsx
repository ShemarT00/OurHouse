import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { Button, TextInput } from '../components/atoms';

interface ProfileFormData {
  name: string;
  email: string;
}

interface ProfileScreenProps {
  user: User;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // TODO: call API to update profile
      console.log(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-10 pb-6">
        <Text className="text-2xl font-bold mb-1">Profile</Text>
        <Text className="text-gray-500 mb-8">Manage your account details.</Text>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Full Name"
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Email"
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />

        <View className="mt-4 p-3 bg-gray-100 rounded-xl">
          <Text className="text-xs text-gray-400 mb-1">Invite Code</Text>
          <Text className="font-mono text-base">{user.inviteCode}</Text>
        </View>

        <View className="mt-6">
          <Button
            label={isPending ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit((data) => mutate(data))}
            disabled={isPending}
          />
        </View>

        <View className="mt-3">
          <Button
            label="Sign Out"
            onPress={() => {/* TODO: call auth sign-out */}}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
