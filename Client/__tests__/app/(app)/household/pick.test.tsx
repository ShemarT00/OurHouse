import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PickScreen from '@/app/(app)/household/pick';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useLists } from '@/hooks/useLists';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockDismissAll = jest.fn();
let mockNext = 'list';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, dismissAll: mockDismissAll }),
  useLocalSearchParams: () => ({ next: mockNext }),
  // The screen is always focused here
  useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));
jest.mock('@/hooks/useHouseholds', () => ({ useHouseholds: jest.fn() }));
jest.mock('@/hooks/useLists', () => ({ useLists: jest.fn() }));

const query = { isLoading: false, error: null };
const withHouseholds = (households: Array<{ OHID: number; name: string }>) =>
  (useHouseholds as jest.Mock).mockReturnValue({ ...query, households });
// Lists for each household: useLists is called with the chosen household's id ('' before one is chosen)
const withLists = (byHousehold: Record<string, Array<{ OHID: number; name: string }>>) =>
  (useLists as jest.Mock).mockImplementation((householdId: string) => ({ ...query, lists: byHousehold[householdId] ?? [] }));

const smiths = { OHID: 5, name: 'The Smiths' };
const flat = { OHID: 6, name: 'Flat 4B' };

describe('PickScreen (Menu shortcuts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = 'list';
    withLists({});
  });

  it("next=list: choosing a Household opens its New List screen, with the Household beneath", () => {
    withHouseholds([smiths, flat]);
    const { getByText } = render(<PickScreen />);

    fireEvent.press(getByText('Flat 4B'));

    expect(mockPush).toHaveBeenCalledWith(
      { pathname: '/(app)/household/[householdId]/list/create', params: { householdId: 6 } },
      { withAnchor: true }
    );
  });

  it('next=item: choosing a Household, then a Shopping List, opens Add Item on that list', () => {
    mockNext = 'item';
    withHouseholds([smiths, flat]);
    withLists({ '5': [{ OHID: 3, name: 'Weekly shop' }, { OHID: 4, name: 'Party' }] });
    const { getByText } = render(<PickScreen />);

    fireEvent.press(getByText('The Smiths'));
    fireEvent.press(getByText('Party'));

    expect(mockPush).toHaveBeenCalledWith(
      {
        pathname: '/(app)/household/[householdId]/list/[listId]/item/create',
        params: { householdId: 5, listId: 4 },
      },
      { withAnchor: true }
    );
  });

  it('next=list with one Household skips choosing it', () => {
    withHouseholds([smiths]);
    render(<PickScreen />);

    expect(mockPush).toHaveBeenCalledWith(
      { pathname: '/(app)/household/[householdId]/list/create', params: { householdId: 5 } },
      { withAnchor: true }
    );
  });

  it('next=item skips both choices when there is one Household with one Shopping List', () => {
    mockNext = 'item';
    withHouseholds([smiths]);
    withLists({ '5': [{ OHID: 3, name: 'Weekly shop' }] });
    render(<PickScreen />);

    expect(mockPush).toHaveBeenCalledWith(
      {
        pathname: '/(app)/household/[householdId]/list/[listId]/item/create',
        params: { householdId: 5, listId: 3 },
      },
      { withAnchor: true }
    );
  });

  it('skips only once, even when the Households are fetched again', () => {
    withHouseholds([smiths]);
    const { rerender } = render(<PickScreen />);

    withHouseholds([{ ...smiths }]);
    rerender(<PickScreen />);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('with no Households, offers to create or join one in place of the picker', () => {
    withHouseholds([]);
    const { getByText } = render(<PickScreen />);

    expect(getByText('No households yet.')).toBeTruthy();
    fireEvent.press(getByText('Create Household'));
    fireEvent.press(getByText('Join Household'));

    expect(mockReplace.mock.calls).toEqual([['/(app)/household/create'], ['/(app)/household/join']]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('next=item: a Household with no Shopping Lists offers New List', () => {
    mockNext = 'item';
    withHouseholds([smiths, flat]);
    withLists({ '6': [] });
    const { getByText } = render(<PickScreen />);

    fireEvent.press(getByText('Flat 4B'));
    expect(getByText('No shopping lists yet')).toBeTruthy();
    fireEvent.press(getByText('New List'));

    expect(mockPush).toHaveBeenCalledWith(
      { pathname: '/(app)/household/[householdId]/list/create', params: { householdId: 6 } },
      { withAnchor: true }
    );
  });

  it('Back steps back one choice at a time, then closes', () => {
    mockNext = 'item';
    withHouseholds([smiths, flat]);
    withLists({ '5': [{ OHID: 3, name: 'Weekly shop' }, { OHID: 4, name: 'Party' }] });
    const { getByText } = render(<PickScreen />);

    fireEvent.press(getByText('The Smiths'));
    fireEvent.press(getByText('← Back'));
    expect(getByText('Flat 4B')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();

    fireEvent.press(getByText('← Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('Back from choosing a Shopping List closes when the Household was not chosen', () => {
    mockNext = 'item';
    withHouseholds([smiths]);
    withLists({ '5': [{ OHID: 3, name: 'Weekly shop' }, { OHID: 4, name: 'Party' }] });
    const { getByText } = render(<PickScreen />);

    fireEvent.press(getByText('← Back'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows no empty state while Households or Shopping Lists are still loading', () => {
    (useHouseholds as jest.Mock).mockReturnValue({ ...query, households: [], isLoading: true });
    expect(render(<PickScreen />).queryByText('No households yet.')).toBeNull();

    mockNext = 'item';
    withHouseholds([smiths, flat]);
    (useLists as jest.Mock).mockReturnValue({ ...query, lists: [], isLoading: true });
    const { getByText, queryByText } = render(<PickScreen />);
    fireEvent.press(getByText('The Smiths'));
    expect(queryByText('No shopping lists yet')).toBeNull();
  });
});
