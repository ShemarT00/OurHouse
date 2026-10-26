import { Stack } from 'expo-router';

// Stack for the household screens, so they share one hidden tab and Back works within them
export default function HouseholdLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
