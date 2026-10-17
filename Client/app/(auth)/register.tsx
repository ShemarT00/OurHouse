import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signupAsync, signupMutation } = useAuth();
  // Email address awaiting confirmation; set when Supabase needs the user to confirm before logging in
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { needsConfirmation } = await signupAsync(data);
      if (needsConfirmation) {
        setPendingEmail(data.email);
      } else {
        router.replace('/(app)');
      }
    } catch {
      // signupMutation.isError is now true; error renders below the form
    }
  };

  if (pendingEmail) {
    return (
      <View className="flex-1 justify-center px-6 bg-white">
        <Text className="text-2xl font-bold mb-4 text-center">Check your email</Text>
        <Text className="text-base text-gray-600 mb-8 text-center">
          We sent a confirmation link to {pendingEmail}. Confirm your account, then sign in.
        </Text>
        <Pressable
          className="bg-blue-600 rounded-lg py-3 items-center"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-white font-semibold text-base">Go to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" className="px-6">
      <Text className="text-3xl font-bold mb-8 text-center">Create Account</Text>

      <Controller
        control={control}
        name="firstName"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="First Name"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.firstName && <Text className="text-red-500 text-sm mb-3">First name is required</Text>}

      <Controller
        control={control}
        name="lastName"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="Last Name"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.lastName && <Text className="text-red-500 text-sm mb-3">Last name is required</Text>}

      <Controller
        control={control}
        name="email"
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.email && <Text className="text-red-500 text-sm mb-3">Email is required</Text>}

      <Controller
        control={control}
        name="password"
        rules={{ required: true, minLength: 6 }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1"
            placeholder="Password"
            secureTextEntry
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.password && (
        <Text className="text-red-500 text-sm mb-5">
          {errors.password.type === 'minLength' ? 'Password must be at least 6 characters' : 'Password is required'}
        </Text>
      )}

      {signupMutation.isError && (
        <Text className="text-red-500 mb-4 text-center">
          {signupMutation.error?.message ?? 'Registration failed'}
        </Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={handleSubmit(onSubmit)}
        disabled={signupMutation.isPending}
      >
        {signupMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Register</Text>
        )}
      </Pressable>

      <Pressable className="mt-4 items-center" onPress={() => router.back()}>
        <Text className="text-blue-600">Already have an account? Sign In</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
