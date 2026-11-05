import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** The app's version, from its configuration (app.json) */
export const appVersion = (): string => Constants.expoConfig?.version ?? 'unknown';

/** The phone and its OS, e.g. "google Pixel 8, Android 14" or "iPhone, iOS 17.4" */
export const deviceDescription = (): string => {
  if (Platform.OS === 'android') {
    const { Brand, Model, Release } = Platform.constants;
    return `${Brand} ${Model}, Android ${Release}`;
  }
  if (Platform.OS === 'ios') {
    const { interfaceIdiom, systemName, osVersion } = Platform.constants;
    return `${interfaceIdiom === 'pad' ? 'iPad' : 'iPhone'}, ${systemName} ${osVersion}`;
  }
  return Platform.OS;
};

/**
 * A mailto link to OurHouse's feedback address with the app version and device
 * filled in, or null when no address is configured. The address comes from
 * EXPO_PUBLIC_FEEDBACK_EMAIL so no personal address is shipped in the app.
 */
export const feedbackLink = (): string | null => {
  const address = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL?.trim();
  if (!address) {
    return null;
  }
  const body = `\n\n---\nApp version: ${appVersion()}\nDevice: ${deviceDescription()}`;
  return `mailto:${address}?subject=${encodeURIComponent('OurHouse feedback')}&body=${encodeURIComponent(body)}`;
};
