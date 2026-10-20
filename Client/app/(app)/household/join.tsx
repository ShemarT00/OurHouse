import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useHouseholds } from '@/hooks/useHouseholds';

interface JoinHouseholdForm {
  code: string;
}

// Invite codes are 8 letters/digits (see generate_invite_code in migration 005)
const INVITE_CODE_PATTERN = /^[A-Za-z0-9]{8}$/;

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const { joinHouseholdAsync, joinMutation } = useHouseholds();

  const { control, handleSubmit, formState: { errors } } = useForm<JoinHouseholdForm>({
    defaultValues: { code: '' },
  });

  const onSubmit = async (data: JoinHouseholdForm) => {
    try {
      const household = await joinHouseholdAsync({ code: data.code });
      router.replace({ pathname: '/(app)/household/[id]', params: { id: household.OHID } });
    } catch {
      // joinMutation.isError is now true; the error renders above the button
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-14">
      <Pressable className="mb-6" onPress={() => router.back()}>
        <Text className="text-blue-600">← Back</Text>
      </Pressable>

      <Text className="text-2xl font-bold mb-2">Join a Household</Text>
      <Text className="text-base text-gray-500 mb-8">
        Ask a member for the household's invite code, then enter it here.
      </Text>

      <Text className="text-sm text-gray-500 mb-2">Invite Code</Text>
      <Controller
        control={control}
        name="code"
        rules={{
          required: 'Enter the invite code',
          validate: (value) =>
            INVITE_CODE_PATTERN.test(value.trim()) || 'Invite codes are 8 letters and numbers',
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-1 text-xl tracking-widest font-mono"
            placeholder="ABCD2345"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Text className="text-red-500 text-sm mb-7">{errors.code?.message ?? ''}</Text>

      {joinMutation.isError && (
        <Text className="text-red-500 mb-4">{joinMutation.error?.message}</Text>
      )}

      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center active:bg-blue-700"
        onPress={handleSubmit(onSubmit)}
        disabled={joinMutation.isPending}
      >
        {joinMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Join Household</Text>
        )}
      </Pressable>
    </View>
  );
}
