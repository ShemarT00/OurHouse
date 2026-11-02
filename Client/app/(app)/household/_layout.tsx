import { Stack } from 'expo-router';

// Stack for the household screens, so they share one hidden tab and Back works within them.
// Its first screen (index) goes Home: navigating here with withAnchor puts it beneath the
// household, so Back from a household goes Home rather than to another household screen.
export const unstable_settings = { initialRouteName: 'index' };

export default function HouseholdLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      screenListeners={({ navigation }) => ({
        // Leaving the household tab clears its history, so the next household opened
        // does not have earlier ones (or a half-made one) beneath it
        blur: () => {
          if (!navigation.getParent()?.isFocused() && navigation.getState().index > 0) {
            navigation.dispatch({ type: 'POP_TO_TOP' });
          }
        },
      })}
    />
  );
}
