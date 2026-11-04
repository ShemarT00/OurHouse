import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/app/(app)/settings';
import { useUserProfile } from '@/hooks/useUserProfile';

const mockUpdateProfileAsync = jest.fn();
const mockReplace = jest.fn();
// Signs out straight away
const mockLogout = jest.fn((_: undefined, options?: { onSuccess?: () => void }) => options?.onSuccess?.());

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout, logoutMutation: { isPending: false } }),
}));
jest.mock('@/hooks/useUserProfile', () => ({ useUserProfile: jest.fn() }));

const withProfile = (name: string, update = {}) =>
  (useUserProfile as jest.Mock).mockReturnValue({
    profile: { OHID: 'u1', name, email: 'jane@example.com', createdAt: '' },
    isLoading: false,
    error: null,
    updateProfileAsync: mockUpdateProfileAsync,
    updateMutation: { isPending: false, isError: false, error: null, reset: jest.fn(), ...update },
  });

describe('SettingsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the account's name and email under a Profile heading", () => {
    withProfile('Jane Doe');
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
  });

  it('signing out returns to the login screen', () => {
    withProfile('Jane Doe');
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Sign Out'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('shows the current name with an Edit button', () => {
    withProfile('Jane Doe');
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
  });

  it('saves the trimmed name and returns to display mode', async () => {
    withProfile('Jane Doe');
    mockUpdateProfileAsync.mockResolvedValueOnce({ OHID: 'u1', name: 'New Name' });
    const { getByText, getByDisplayValue, queryByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), '  New Name ');
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(mockUpdateProfileAsync).toHaveBeenCalledWith({ name: 'New Name' }));
    await waitFor(() => expect(queryByText('Save')).toBeNull());
    expect(getByText('Edit')).toBeTruthy();
  });

  it('rejects a blank name without saving', async () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, findByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), '   ');
    fireEvent.press(getByText('Save'));

    expect(await findByText('Name is required')).toBeTruthy();
    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
  });

  it('rejects a name over 255 characters without saving', async () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, findByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), 'a'.repeat(256));
    fireEvent.press(getByText('Save'));

    expect(await findByText('Name must be 255 characters or fewer')).toBeTruthy();
    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
  });

  it('cancel restores the original name without saving', () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, queryByDisplayValue } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), 'Changed');
    fireEvent.press(getByText('Cancel'));

    expect(getByText('Jane Doe')).toBeTruthy();
    expect(queryByDisplayValue('Changed')).toBeNull();
    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
  });

  it('shows why saving failed and stays in edit mode', async () => {
    withProfile('Jane Doe');
    mockUpdateProfileAsync.mockRejectedValueOnce(new Error('Name must be 1-255 characters'));
    const { getByText, getByDisplayValue, rerender } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), 'New Name');
    fireEvent.press(getByText('Save'));
    await waitFor(() => expect(mockUpdateProfileAsync).toHaveBeenCalled());

    // The mutation has now failed
    withProfile('Jane Doe', { isError: true, error: new Error('Name must be 1-255 characters') });
    rerender(<SettingsScreen />);

    expect(getByText('Name must be 1-255 characters')).toBeTruthy();
    expect(getByDisplayValue('New Name')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
  });

  it('allows a 255-character name with spaces around it, as the server does', async () => {
    withProfile('Jane Doe');
    mockUpdateProfileAsync.mockResolvedValueOnce({});
    const { getByText, getByDisplayValue } = render(<SettingsScreen />);

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), ` ${'a'.repeat(255)} `);
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(mockUpdateProfileAsync).toHaveBeenCalledWith({ name: 'a'.repeat(255) }));
  });
});
