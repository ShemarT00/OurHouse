import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextInput } from '../components/atoms';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    // TODO: call auth service
    console.log(data);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-12 justify-center">
        <Text className="text-3xl font-bold text-center mb-2">OurHouse</Text>
        <Text className="text-base text-gray-500 text-center mb-10">
          Sign in to your household
        </Text>

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

        <Controller
          control={control}
          name="password"
          rules={{ required: 'Password is required' }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Password"
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <View className="mt-4">
          <Button
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
          />
        </View>

        <Text className="text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <Text className="text-blue-600 font-semibold">Register</Text>
        </Text>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;
