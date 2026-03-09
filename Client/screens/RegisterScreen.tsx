import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button, TextInput } from '../components/atoms';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterScreen: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = (data: RegisterFormData) => {
    // TODO: call auth service
    console.log(data);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-12 justify-center">
        <Text className="text-3xl font-bold text-center mb-2">OurHouse</Text>
        <Text className="text-base text-gray-500 text-center mb-10">
          Create your account
        </Text>

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

        <Controller
          control={control}
          name="password"
          rules={{ required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } }}
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

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Confirm Password"
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label="Create Account"
          onPress={handleSubmit(onSubmit)}
          className="mt-4"
        />

        <Text className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Text className="text-blue-600 font-semibold">Sign In</Text>
        </Text>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;
