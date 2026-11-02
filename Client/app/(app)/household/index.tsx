import { Redirect } from 'expo-router';

// Beneath every household (see household/_layout.tsx): reaching it means going Back
// from a household, whose parent is Home
export default function HouseholdIndex() {
  return <Redirect href="/(app)" />;
}
