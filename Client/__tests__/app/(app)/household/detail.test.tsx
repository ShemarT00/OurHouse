import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HouseholdDetailScreen from '@/app/(app)/household/[id]';
import { useHousehold } from '@/hooks/useHouseholds';
import { useLists } from '@/hooks/useLists';
import { useHouseholdMembers } from '@/hooks/useHouseholdMembers';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ id: '5' }),
}));

jest.mock('@/hooks/useHouseholds', () => ({ useHousehold: jest.fn() }));
jest.mock('@/hooks/useLists', () => ({ useLists: jest.fn() }));
jest.mock('@/hooks/useHouseholdMembers', () => ({ useHouseholdMembers: jest.fn() }));

const withLists = (lists: Array<{ OHID: number; name: string }>, error: Error | null = null) =>
  (useLists as jest.Mock).mockReturnValue({
    lists,
    isLoading: false,
    error,
    refetch: jest.fn(),
    isRefetching: false,
  });

describe('HouseholdDetailScreen — shopping lists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useHousehold as jest.Mock).mockReturnValue({
      household: { OHID: 5, name: 'The Smiths', inviteCode: 'ABCD2345' },
      isLoading: false,
    });
    (useHouseholdMembers as jest.Mock).mockReturnValue({ members: [] });
  });

  it("shows all of the household's lists", () => {
    withLists([
      { OHID: 1, name: 'Weekly shop' },
      { OHID: 2, name: 'Party' },
    ]);

    const { getByText } = render(<HouseholdDetailScreen />);

    expect(useLists).toHaveBeenCalledWith('5');
    expect(getByText('Weekly shop')).toBeTruthy();
    expect(getByText('Party')).toBeTruthy();
  });

  it('opens a list when it is tapped', () => {
    withLists([{ OHID: 1, name: 'Weekly shop' }]);

    const { getByText } = render(<HouseholdDetailScreen />);
    fireEvent.press(getByText('Weekly shop'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/list/[id]', params: { id: 1, householdId: '5' } });
  });

  it('goes to the new list screen for this household', () => {
    withLists([]);

    const { getByText } = render(<HouseholdDetailScreen />);
    fireEvent.press(getByText('+ New List'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/list/create', params: { householdId: '5' } });
  });

  it('shows an empty state, or the error if lists fail to load', () => {
    withLists([]);
    expect(render(<HouseholdDetailScreen />).getByText('No lists yet. Create one!')).toBeTruthy();

    withLists([], new Error('HTTP 500'));
    expect(render(<HouseholdDetailScreen />).getByText('HTTP 500')).toBeTruthy();
  });
});
