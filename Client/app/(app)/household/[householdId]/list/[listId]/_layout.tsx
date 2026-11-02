import { Stack } from 'expo-router';

// A shopping list and its item screens, so a link straight to an item still
// opens its list beneath it
export const unstable_settings = { initialRouteName: 'index' };

export default function ListIdLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
