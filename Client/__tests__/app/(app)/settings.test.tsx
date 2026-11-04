import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsScreen from '@/app/(app)/settings';
import { getHouseholds, setHouseholdMuted } from '@/services/household';
import { getUserProfile, updateUserProfile, setSwitchedOffEvents } from '@/services/user';
import { ItemEvent } from '@/types';
import type { MemberHousehold, User } from '@/types';

const mockReplace = jest.fn();
// Signs out straight away
const mockLogout = jest.fn((_: undefined, options?: { onSuccess?: () => void }) => options?.onSuccess?.());

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout, logoutMutation: { isPending: false } }),
}));
// The profile and households come through the real hooks, so saving and rolling back run as in the app
jest.mock('@/services/user', () => ({
  getUserProfile: jest.fn(), updateUserProfile: jest.fn(), setSwitchedOffEvents: jest.fn(),
}));
jest.mock('@/services/household', () => ({ getHouseholds: jest.fn(), setHouseholdMuted: jest.fn() }));
// The real throwIfError turns a failed response into the error shown; no requests are made
jest.mock('@/services/config', () => ({}));

const user = (name: string, switchedOffEvents: ItemEvent[] = []): User => ({
  OHID: 'u1', name, email: 'jane@example.com', createdAt: '', switchedOffEvents,
});
const ok = <T,>(data: T) => ({ success: true, data });
const failed = (message: string) => ({ success: false, error: { message } });

const withProfile = (name: string, switchedOffEvents: ItemEvent[] = []) =>
  (getUserProfile as jest.Mock).mockResolvedValue(ok(user(name, switchedOffEvents)));

const household = (OHID: number, name: string, muted: boolean): MemberHousehold => ({
  OHID, name, muted, inviteCode: 'ABCD2345', createdBy: 'u1', createdAt: '',
});
const withHouseholds = (...households: MemberHousehold[]) =>
  (getHouseholds as jest.Mock).mockResolvedValue(ok(households));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
/** Render Settings and wait for the profile to load */
const renderSettings = async () => {
  const view = render(<SettingsScreen />, { wrapper });
  await screen.findByText('Settings');
  return view;
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No garbage-collection timers, so Jest can exit
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
    withProfile('Jane Doe');
    withHouseholds();
  });

  afterEach(async () => {
    // Let a fetch the test didn't wait for finish inside act
    await act(async () => {});
    queryClient.clear();
  });

  it("shows the account's name and email under a Profile heading", async () => {
    await renderSettings();

    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('jane@example.com')).toBeTruthy();
  });

  it('signing out returns to the login screen', async () => {
    await renderSettings();

    fireEvent.press(screen.getByText('Sign Out'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  describe('Name', () => {
    const editName = (to: string) => {
      fireEvent.press(screen.getByText('Edit'));
      fireEvent.changeText(screen.getByDisplayValue('Jane Doe'), to);
      fireEvent.press(screen.getByText('Save'));
    };

    it('shows the current name with an Edit button', async () => {
      await renderSettings();

      expect(screen.getByText('Jane Doe')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
    });

    it('saves the trimmed name and returns to display mode', async () => {
      (updateUserProfile as jest.Mock).mockResolvedValue(ok(user('New Name')));
      await renderSettings();

      editName('  New Name ');

      await waitFor(() => expect(screen.queryByText('Save')).toBeNull());
      expect(updateUserProfile).toHaveBeenCalledWith({ name: 'New Name' });
      expect(screen.getByText('New Name')).toBeTruthy();
      expect(screen.getByText('Edit')).toBeTruthy();
    });

    it('rejects a blank name without saving', async () => {
      await renderSettings();

      editName('   ');

      expect(await screen.findByText('Name is required')).toBeTruthy();
      expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('rejects a name over 255 characters without saving', async () => {
      await renderSettings();

      editName('a'.repeat(256));

      expect(await screen.findByText('Name must be 255 characters or fewer')).toBeTruthy();
      expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('cancel restores the original name without saving', async () => {
      await renderSettings();

      fireEvent.press(screen.getByText('Edit'));
      fireEvent.changeText(screen.getByDisplayValue('Jane Doe'), 'Changed');
      fireEvent.press(screen.getByText('Cancel'));

      expect(screen.getByText('Jane Doe')).toBeTruthy();
      expect(screen.queryByDisplayValue('Changed')).toBeNull();
      expect(updateUserProfile).not.toHaveBeenCalled();
    });

    it('shows why saving failed and stays in edit mode', async () => {
      (updateUserProfile as jest.Mock).mockResolvedValue(failed('Name must be 1-255 characters'));
      await renderSettings();

      editName('New Name');

      expect(await screen.findByText('Name must be 1-255 characters')).toBeTruthy();
      expect(screen.getByDisplayValue('New Name')).toBeTruthy();
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('allows a 255-character name with spaces around it, as the server does', async () => {
      (updateUserProfile as jest.Mock).mockResolvedValue(ok(user('a'.repeat(255))));
      await renderSettings();

      editName(` ${'a'.repeat(255)} `);

      await waitFor(() => expect(updateUserProfile).toHaveBeenCalledWith({ name: 'a'.repeat(255) }));
    });
  });

  describe('Notifications from each household', () => {
    it('lists every household with whether its notifications are on', async () => {
      withHouseholds(household(5, 'The Smiths', false), household(6, 'Flat 4B', true));
      await renderSettings();

      expect(screen.getByText('Notifications from each household')).toBeTruthy();
      expect((await screen.findByLabelText('The Smiths')).props.value).toBe(true);
      expect(screen.getByLabelText('Flat 4B').props.value).toBe(false);
      expect(screen.getAllByText('Muted')).toHaveLength(1);
    });

    it('flipping a switch saves straight away', async () => {
      withHouseholds(household(5, 'The Smiths', false));
      (setHouseholdMuted as jest.Mock).mockResolvedValue(ok({ householdId: 5, muted: true }));
      await renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);

      await waitFor(() => expect(screen.getByLabelText('The Smiths').props.value).toBe(false));
      expect(screen.getByText('Muted')).toBeTruthy();
      expect(setHouseholdMuted).toHaveBeenCalledWith(5, true);
    });

    it('a failed save flips the switch back and shows why', async () => {
      withHouseholds(household(5, 'The Smiths', false));
      (setHouseholdMuted as jest.Mock).mockResolvedValue(failed('Something went wrong. Please try again.'));
      await renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      expect(screen.getByLabelText('The Smiths').props.value).toBe(true);
      expect(screen.queryByText('Muted')).toBeNull();
    });

    it("a failed save only flips back its own household, not one saved meanwhile", async () => {
      withHouseholds(household(5, 'The Smiths', false), household(6, 'Flat 4B', false));
      let failSmiths = () => {};
      (setHouseholdMuted as jest.Mock).mockImplementation((OHID: number, muted: boolean) =>
        OHID === 5
          ? new Promise((resolve) => {
              failSmiths = () => resolve(failed('Something went wrong. Please try again.'));
            })
          : Promise.resolve(ok({ householdId: OHID, muted })));
      await renderSettings();

      fireEvent(await screen.findByLabelText('The Smiths'), 'valueChange', false);
      fireEvent(screen.getByLabelText('Flat 4B'), 'valueChange', false);
      await waitFor(() => expect(screen.getByLabelText('Flat 4B').props.value).toBe(false));
      await act(async () => failSmiths());

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      expect(screen.getByLabelText('The Smiths').props.value).toBe(true);
      expect(screen.getByLabelText('Flat 4B').props.value).toBe(false);
    });
  });

  describe('Tell me when an item is', () => {
    const switchValue = (label: string) => screen.getByLabelText(label).props.value;
    // The server saves the events and returns the profile
    const savesSwitchedOff = () =>
      (setSwitchedOffEvents as jest.Mock).mockImplementation((events: ItemEvent[]) =>
        Promise.resolve(ok(user('Jane Doe', events))));

    it('shows four switches, all on for an account with nothing switched off', async () => {
      await renderSettings();

      expect(screen.getByText('Tell me when an item is')).toBeTruthy();
      for (const label of ['Added', 'Edited', 'Bought or un-bought', 'Removed']) {
        expect(switchValue(label)).toBe(true);
      }
    });

    it('shows a switch off when its events are switched off', async () => {
      withProfile('Jane Doe', [ItemEvent.EDITED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT]);
      await renderSettings();

      expect(switchValue('Added')).toBe(true);
      expect(switchValue('Edited')).toBe(false);
      expect(switchValue('Bought or un-bought')).toBe(false);
      expect(switchValue('Removed')).toBe(true);
    });

    it('flipping a switch saves straight away', async () => {
      savesSwitchedOff();
      await renderSettings();

      fireEvent(screen.getByLabelText('Edited'), 'valueChange', false);

      await waitFor(() => expect(switchValue('Edited')).toBe(false));
      expect(setSwitchedOffEvents).toHaveBeenCalledWith([ItemEvent.EDITED]);
    });

    it('the Bought or un-bought switch switches off both events, and back on removes both', async () => {
      withProfile('Jane Doe', [ItemEvent.ADDED]);
      savesSwitchedOff();
      await renderSettings();

      fireEvent(screen.getByLabelText('Bought or un-bought'), 'valueChange', false);
      await waitFor(() => expect(switchValue('Bought or un-bought')).toBe(false));
      expect(setSwitchedOffEvents).toHaveBeenLastCalledWith([ItemEvent.ADDED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT]);

      fireEvent(screen.getByLabelText('Bought or un-bought'), 'valueChange', true);
      await waitFor(() => expect(setSwitchedOffEvents).toHaveBeenLastCalledWith([ItemEvent.ADDED]));
      expect(switchValue('Bought or un-bought')).toBe(true);
    });

    it('a failed save flips the switch back and shows why', async () => {
      (setSwitchedOffEvents as jest.Mock).mockResolvedValue(failed('Something went wrong. Please try again.'));
      await renderSettings();

      fireEvent(screen.getByLabelText('Removed'), 'valueChange', false);

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      expect(switchValue('Removed')).toBe(true);
    });

    it('a switch flipped while another is saving is saved without the one that failed', async () => {
      let failAdded = () => {};
      (setSwitchedOffEvents as jest.Mock)
        .mockImplementationOnce(() => new Promise((resolve) => {
          failAdded = () => resolve(failed('Something went wrong. Please try again.'));
        }))
        .mockImplementation((events: ItemEvent[]) => Promise.resolve(ok(user('Jane Doe', events))));
      await renderSettings();

      fireEvent(screen.getByLabelText('Added'), 'valueChange', false);
      fireEvent(screen.getByLabelText('Edited'), 'valueChange', false);
      await waitFor(() => expect(switchValue('Edited')).toBe(false));
      await act(async () => failAdded());

      expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
      await waitFor(() => expect(setSwitchedOffEvents).toHaveBeenLastCalledWith([ItemEvent.EDITED]));
      expect(setSwitchedOffEvents).toHaveBeenCalledTimes(2);
      expect(switchValue('Added')).toBe(true);
      expect(switchValue('Edited')).toBe(false);
    });
  });
});
