import { Redirect } from 'expo-router';

export default function MenuScreen() {
  return <Redirect href="/(app)" />; // This screen is just a placeholder to handle the /menu route, which is used by the BurgerMenuButton. It redirects back to the home screen.
}
