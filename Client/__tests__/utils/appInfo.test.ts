import { Platform } from 'react-native';
import { deviceDescription, feedbackLink } from '@/utils/appInfo';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.4.2' } } }));

const onPlatform = (OS: typeof Platform.OS, constants: object) => {
  jest.replaceProperty(Platform, 'OS', OS);
  jest.spyOn(Platform, 'constants', 'get').mockReturnValue(constants as typeof Platform.constants);
};

describe('deviceDescription', () => {
  afterEach(() => jest.restoreAllMocks());

  it("names an Android phone's maker, model and Android version", () => {
    onPlatform('android', { Brand: 'google', Model: 'Pixel 8', Release: '14' });
    expect(deviceDescription()).toBe('google Pixel 8, Android 14');
  });

  it('names an iPhone and its iOS version', () => {
    onPlatform('ios', { interfaceIdiom: 'phone', systemName: 'iOS', osVersion: '17.4' });
    expect(deviceDescription()).toBe('iPhone, iOS 17.4');
  });

  it('names an iPad and its iPadOS version', () => {
    onPlatform('ios', { interfaceIdiom: 'pad', systemName: 'iPadOS', osVersion: '17.4' });
    expect(deviceDescription()).toBe('iPad, iPadOS 17.4');
  });
});

describe('feedbackLink', () => {
  const feedbackEmail = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
  afterEach(() => {
    jest.restoreAllMocks();
    if (feedbackEmail === undefined) delete process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
    else process.env.EXPO_PUBLIC_FEEDBACK_EMAIL = feedbackEmail;
  });

  it('is an email to the feedback address with the app version and device in the body', () => {
    process.env.EXPO_PUBLIC_FEEDBACK_EMAIL = ' feedback@ourhouse.example ';
    onPlatform('android', { Brand: 'google', Model: 'Pixel 8', Release: '14' });

    const [address, query] = (feedbackLink() ?? '').split('?');

    expect(address).toBe('mailto:feedback@ourhouse.example');
    const params = new URLSearchParams(query);
    expect(params.get('subject')).toBe('OurHouse feedback');
    expect(params.get('body')).toBe('\n\n---\nApp version: 1.4.2\nDevice: google Pixel 8, Android 14');
  });

  it.each([undefined, '', '   '])('is null when the feedback address is %p', (address) => {
    if (address === undefined) delete process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
    else process.env.EXPO_PUBLIC_FEEDBACK_EMAIL = address;

    expect(feedbackLink()).toBeNull();
  });
});
