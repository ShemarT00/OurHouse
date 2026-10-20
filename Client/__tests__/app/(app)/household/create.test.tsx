import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateHouseholdScreen from '@/app/(app)/household/create';
import { useHouseholds } from '@/hooks/useHouseholds';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCreateHouseholdAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

jest.mock('@/hooks/useHouseholds', () => ({
  useHouseholds: jest.fn(),
}));

const mockUseHouseholds = useHouseholds as jest.Mock;
const defaultMutation = { isPending: false, isError: false, error: null };

describe('CreateHouseholdScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHouseholds.mockReturnValue({
      createHouseholdAsync: mockCreateHouseholdAsync,
      createMutation: { ...defaultMutation },
    });
  });

  it('creates the household and opens it so the invite code can be shared', async () => {
    mockCreateHouseholdAsync.mockResolvedValueOnce({ OHID: 42, name: 'The Smiths', inviteCode: 'ABCD2345' });
    const { getByPlaceholderText, getByText } = render(<CreateHouseholdScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. The Smith Family'), '  The Smiths  ');
    fireEvent.press(getByText('Create Household'));

    await waitFor(() => {
      expect(mockCreateHouseholdAsync).toHaveBeenCalledWith({ name: 'The Smiths' });
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/(app)/household/[id]', params: { id: 42 } });
    });
  });

  it('requires a name', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<CreateHouseholdScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. The Smith Family'), '   ');
    fireEvent.press(getByText('Create Household'));

    expect(await findByText('Household name is required')).toBeTruthy();
    expect(mockCreateHouseholdAsync).not.toHaveBeenCalled();
  });

  it('stays on the screen when creating fails', async () => {
    mockCreateHouseholdAsync.mockRejectedValueOnce(new Error('HTTP 500'));
    const { getByPlaceholderText, getByText } = render(<CreateHouseholdScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. The Smith Family'), 'The Smiths');
    fireEvent.press(getByText('Create Household'));

    await waitFor(() => expect(mockCreateHouseholdAsync).toHaveBeenCalled());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the error message from a failed create', () => {
    mockUseHouseholds.mockReturnValue({
      createHouseholdAsync: mockCreateHouseholdAsync,
      createMutation: { ...defaultMutation, isError: true, error: new Error('Something went wrong') },
    });

    const { getByText } = render(<CreateHouseholdScreen />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
