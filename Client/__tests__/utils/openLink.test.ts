import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { openLink } from '@/utils/openLink';

jest.mock('expo-linking', () => ({ openURL: jest.fn() }));

const mockOpenURL = Linking.openURL as jest.Mock;

describe('openLink', () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens the link with the phone's default handler", async () => {
    mockOpenURL.mockResolvedValueOnce(true);

    await openLink('https://www.tesco.com');

    expect(mockOpenURL).toHaveBeenCalledWith('https://www.tesco.com');
  });

  it('says so when nothing can open it', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockOpenURL.mockRejectedValueOnce(new Error('No handler'));

    await openLink('https://www.tesco.com');

    expect(alert).toHaveBeenCalledWith("Couldn't open link", 'https://www.tesco.com');
  });
});
