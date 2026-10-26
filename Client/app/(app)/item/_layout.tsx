import { Stack } from 'expo-router';

// Stack for the item screens, so they share one hidden tab and Back works within them
export default function ItemLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
