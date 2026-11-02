import { Stack } from 'expo-router';

// A household's screens, its shopping lists and their items in one stack, so
// Back always lands on the parent. A link straight to a list or item still
// opens the household beneath it.
export const unstable_settings = { initialRouteName: 'index' };

export default function HouseholdIdLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
