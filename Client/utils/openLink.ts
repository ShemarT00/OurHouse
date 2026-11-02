import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Open a link with the phone's default handler, so a retailer's own app can open
 * it instead of the browser. Says so if nothing on the phone can open it.
 */
export const openLink = async (url: string): Promise<void> => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open link", url);
  }
};
