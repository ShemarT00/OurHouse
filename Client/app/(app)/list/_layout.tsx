import { Stack } from 'expo-router';

// Stack for the list screens, so they share one hidden tab and Back works within them
export default function ListLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
