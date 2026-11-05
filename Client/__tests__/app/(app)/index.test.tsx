import React from 'react';
import { render, renderHook, fireEvent, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '@/app/(app)/index';
import { useHouseholds } from '@/hooks/useHouseholds';
import { getHouseholds, setHouseholdMuted } from '@/services/household';
import type { MemberHousehold } from '@/types';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
// Households come through the real useHouseholds hook, so Home shows what the rest of the app has saved
jest.mock('@/services/household', () => ({ getHouseholds: jest.fn(), setHouseholdMuted: jest.fn() }));
// The real throwIfError unwraps responses; no requests are made
jest.mock('@/services/config', () => ({}));

const household = (OHID: number, name: string, muted = false): MemberHousehold => ({
  OHID, name, muted, inviteCode: 'ABCD2345', createdBy: 'u1', createdAt: '',
});
const withHouseholds = (...households: MemberHousehold[]) =>
  (getHouseholds as jest.Mock).mockResolvedValue({ success: true, data: households });

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
/** Render Home and wait for the households to load */
const renderHome = async () => {
  const home = render(<HomeScreen />, { wrapper });
  await home.findByText('My Households');
  return home;
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No garbage-collection timers, so Jest can exit
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
  });

  afterEach(() => queryClient.clear());

  it('lists the households the user belongs to', async () => {
    withHouseholds(household(1, 'The Smiths'), household(2, 'Flat 4B'));

    const home = await renderHome();

    expect(home.getByText('The Smiths')).toBeTruthy();
    expect(home.getByText('Flat 4B')).toBeTruthy();
  });

  it('opens a household when it is tapped', async () => {
    withHouseholds(household(7, 'The Smiths'));

    const home = await renderHome();
    fireEvent.press(home.getByText('The Smiths'));

    expect(mockPush).toHaveBeenCalledWith(
      { pathname: '/(app)/household/[householdId]', params: { householdId: 7 } },
      { withAnchor: true }
    );
  });

  it('shows the empty state when the user has no households', async () => {
    withHouseholds();

    const home = await renderHome();

    expect(home.getByText('No households yet.')).toBeTruthy();
  });

  describe('Muted marker', () => {
    it("shows Muted on a muted household's card and nothing on an unmuted one", async () => {
      withHouseholds(household(1, 'The Smiths', true), household(2, 'Flat 4B', false));

      const home = await renderHome();

      expect(home.getByLabelText('The Smiths, muted')).toBeTruthy();
      expect(home.getByLabelText('Flat 4B')).toBeTruthy();
      expect(home.getAllByText('Muted')).toHaveLength(1);
    });

    it('updates when the household is muted or unmuted elsewhere in the app, such as Settings', async () => {
      withHouseholds(household(1, 'The Smiths'));
      (setHouseholdMuted as jest.Mock).mockImplementation((OHID: number, muted: boolean) =>
        Promise.resolve({ success: true, data: { householdId: OHID, muted } }));
      const home = await renderHome();
      expect(home.queryByText('Muted')).toBeNull();
      // Settings mutes through the same hook, in the same running app
      const settings = renderHook(() => useHouseholds(), { wrapper });

      await act(() => settings.result.current.setMutedAsync({ OHID: 1, muted: true }));
      await waitFor(() => expect(home.getByText('Muted')).toBeTruthy());

      await act(() => settings.result.current.setMutedAsync({ OHID: 1, muted: false }));
      await waitFor(() => expect(home.queryByText('Muted')).toBeNull());
    });
  });
});
