import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsScreen from '@/app/(app)/settings';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getHouseholds, setHouseholdMuted } from '@/services/household';
import type { MemberHousehold } from '@/types';

const mockUpdateProfileAsync = jest.fn();
const mockReplace = jest.fn();
// Signs out straight away
const mockLogout = jest.fn((_: undefined, options?: { onSuccess?: () => void }) => options?.onSuccess?.());

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout, logoutMutation: { isPending: false } }),
}));
jest.mock('@/hooks/useUserProfile', () => ({ useUserProfile: jest.fn() }));
// Households come through the real useHouseholds hook, so saving and rolling back run as in the app
jest.mock('@/services/household', () => ({ getHouseholds: jest.fn(), setHouseholdMuted: jest.fn() }));
// The real throwIfError turns a failed response into the error shown; no requests are made
jest.mock('@/services/config', () => ({}));

const household = (OHID: number, name: string, muted: boolean): MemberHousehold => ({
  OHID, name, muted, inviteCode: 'ABCD2345', createdBy: 'u1', createdAt: '',
});
const withHouseholds = (...households: MemberHousehold[]) =>
  (getHouseholds as jest.Mock).mockResolvedValue({ success: true, data: households });

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const renderSettings = () => render(<SettingsScreen />, { wrapper });

const withProfile = (name: string, update = {}) =>
  (useUserProfile as jest.Mock).mockReturnValue({
    profile: { OHID: 'u1', name, email: 'jane@example.com', createdAt: '' },
    isLoading: false,
    error: null,
    updateProfileAsync: mockUpdateProfileAsync,
    updateMutation: { isPending: false, isError: false, error: null, reset: jest.fn(), ...update },
  });

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No garbage-collection timers, so Jest can exit
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
    withHouseholds();
  });

  afterEach(async () => {
    // Let a households fetch the test didn't wait for finish inside act
    await act(async () => {});
    queryClient.clear();
  });

  it("shows the account's name and email under a Profile heading", () => {
    withProfile('Jane Doe');
    const { getByText } = renderSettings();

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
  });

  it('signing out returns to the login screen', () => {
    withProfile('Jane Doe');
    const { getByText } = renderSettings();

    fireEvent.press(getByText('Sign Out'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('shows the current name with an Edit button', () => {
    withProfile('Jane Doe');
    const { getByText } = renderSettings();

    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
  });

  it('saves the trimmed name and returns to display mode', async () => {
    withProfile('Jane Doe');
    mockUpdateProfileAsync.mockResolvedValueOnce({ OHID: 'u1', name: 'New Name' });
    const { getByText, getByDisplayValue, queryByText } = renderSettings();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), '  New Name ');
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(mockUpdateProfileAsync).toHaveBeenCalledWith({ name: 'New Name' }));
    await waitFor(() => expect(queryByText('Save')).toBeNull());
    expect(getByText('Edit')).toBeTruthy();
  });

  it('rejects a blank name without saving', async () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, findByText } = renderSettings();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), '   ');
    fireEvent.press(getByText('Save'));

    expect(await findByText('Name is required')).toBeTruthy();
    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
  });

  it('rejects a name over 255 characters without saving', async () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, findByText } = renderSettings();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), 'a'.repeat(256));
    fireEvent.press(getByText('Save'));

    expect(await findByText('Name must be 255 characters or fewer')).toBeTruthy();
    expect(mockUpdateProfileAsync).not.toHaveBeenCalled();
  });

  it('cancel restores the original name without saving', () => {
    withProfile('Jane Doe');
    const { getByText, getByDisplayValue, queryByDisplayValue } = renderSettings();

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
    const { getByText, getByDisplayValue, rerender } = renderSettings();

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
    const { getByText, getByDisplayValue } = renderSettings();

    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByDisplayValue('Jane Doe'), ` ${'a'.repeat(255)} `);
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(mockUpdateProfileAsync).toHaveBeenCalledWith({ name: 'a'.repeat(255) }));
  });

  describe('Notifications from each household', () => {
    it('lists every household with whether its notifications are on', async () => {
      withProfile('Jane Doe');
      withHouseholds(household(5, 'The Smiths', false), household(6, 'Flat 4B', true));
      renderSettings();

      expect(screen.getByText('Notifications from each household')).toBeTruthy();
      expect((await screen.findByLabelText('The Smiths')).props.value).toBe(true);
      expect(screen.getByLabelText('Flat 4B').props.value).toBe(false);
      expect(screen.getAllByText('Muted')).toHaveLength(1);
    });

    it('flipping a switch saves straight away', async () => {
      withProfile('Jane Doe');
      withHouseholds(household(5, 'The Smiths', false));
      (setHouseholdMuted as jest.Mock).mockResolvedValue({ success: true, data: { householdId: 5, muted: true } });
      renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);

      await waitFor(() => expect(screen.getByLabelText('The Smiths').props.value).toBe(false));
      expect(screen.getByText('Muted')).toBeTruthy();
      expect(setHouseholdMuted).toHaveBeenCalledWith(5, true);
    });

    it('a failed save flips the switch back and shows why', async () => {
      withProfile('Jane Doe');
      withHouseholds(household(5, 'The Smiths', false));
      (setHouseholdMuted as jest.Mock).mockResolvedValue({
        success: false, error: { message: 'Something went wrong. Please try again.' },
      });
      renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      expect(screen.getByLabelText('The Smiths').props.value).toBe(true);
      expect(screen.queryByText('Muted')).toBeNull();
    });

    it("a failed save only flips back its own household, not one saved meanwhile", async () => {
      withProfile('Jane Doe');
      withHouseholds(household(5, 'The Smiths', false), household(6, 'Flat 4B', false));
      let failSmiths = () => {};
      (setHouseholdMuted as jest.Mock).mockImplementation((OHID: number, muted: boolean) =>
        OHID === 5
          ? new Promise((resolve) => {
              failSmiths = () => resolve({ success: false, error: { message: 'Something went wrong. Please try again.' } });
            })
          : Promise.resolve({ success: true, data: { householdId: OHID, muted } }));
      renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);
      fireEvent(screen.getByLabelText('Flat 4B'), 'valueChange', false);
      await waitFor(() => expect(screen.getByLabelText('Flat 4B').props.value).toBe(false));
      await act(async () => failSmiths());

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      expect(screen.getByLabelText('The Smiths').props.value).toBe(true);
      expect(screen.getByLabelText('Flat 4B').props.value).toBe(false);
    });
  });
});
