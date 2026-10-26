import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import JoinHouseholdScreen from '@/app/(app)/household/join';
import { useHouseholds } from '@/hooks/useHouseholds';

const mockReplace = jest.fn();
const mockJoinHouseholdAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/hooks/useHouseholds', () => ({
  useHouseholds: jest.fn(),
}));

const mockUseHouseholds = useHouseholds as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

const enterCode = (utils: ReturnType<typeof render>, code: string) => {
  fireEvent.changeText(utils.getByPlaceholderText('ABCD2345'), code);
  fireEvent.press(utils.getByText('Join Household'));
};

describe('JoinHouseholdScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHouseholds.mockReturnValue({
      joinHouseholdAsync: mockJoinHouseholdAsync,
      joinMutation: { ...defaultMutation },
    });
  });

  it('joins with a valid code and opens the household', async () => {
    mockJoinHouseholdAsync.mockResolvedValueOnce({ OHID: 9, name: 'Flat 4B', inviteCode: 'ABCD2345' });
    const utils = render(<JoinHouseholdScreen />);

    enterCode(utils, 'abcd2345');

    await waitFor(() => {
      expect(mockJoinHouseholdAsync).toHaveBeenCalledWith({ code: 'abcd2345' });
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(app)/household/[id]', params: { id: 9 } });
    });
  });

  it('rejects codes that are not 8 letters and numbers', async () => {
    const utils = render(<JoinHouseholdScreen />);

    enterCode(utils, 'ABC');

    expect(await utils.findByText('Invite codes are 8 letters and numbers')).toBeTruthy();
    expect(mockJoinHouseholdAsync).not.toHaveBeenCalled();
  });

  it('stays on the screen when the code does not match a household', async () => {
    mockJoinHouseholdAsync.mockRejectedValueOnce(new Error('No household has that invite code.'));
    const utils = render(<JoinHouseholdScreen />);

    enterCode(utils, 'ZZZZZZZZ');

    await waitFor(() => expect(mockJoinHouseholdAsync).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the error for an unknown code', () => {
    mockUseHouseholds.mockReturnValue({
      joinHouseholdAsync: mockJoinHouseholdAsync,
      joinMutation: { ...defaultMutation, isError: true, error: new Error('No household has that invite code.') },
    });

    const { getByText } = render(<JoinHouseholdScreen />);
    expect(getByText('No household has that invite code.')).toBeTruthy();
  });
});
