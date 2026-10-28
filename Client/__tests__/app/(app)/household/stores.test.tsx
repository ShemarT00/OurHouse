import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HouseholdStoresScreen from '@/app/(app)/household/stores/[id]';
import { useStores } from '@/hooks/useStores';

const mockCreateStoreAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ id: '5' }),
}));

jest.mock('@/hooks/useHouseholds', () => ({
  useHousehold: () => ({ household: { OHID: 5, name: 'The Smiths' } }),
}));

jest.mock('@/hooks/useStores', () => ({ useStores: jest.fn() }));

const withStores = (stores: Array<{ OHID: number; name: string }>, mutation = {}) =>
  (useStores as jest.Mock).mockReturnValue({
    stores,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
    createStoreAsync: mockCreateStoreAsync,
    createMutation: { isPending: false, isError: false, error: null, ...mutation },
  });

describe('HouseholdStoresScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists the household's stores", () => {
    withStores([{ OHID: 1, name: 'Aldi' }, { OHID: 2, name: 'Tesco' }]);
    const { getByText } = render(<HouseholdStoresScreen />);

    expect(useStores).toHaveBeenCalledWith('5');
    expect(getByText('Aldi')).toBeTruthy();
    expect(getByText('Tesco')).toBeTruthy();
  });

  it('shows an empty state', () => {
    withStores([]);
    expect(render(<HouseholdStoresScreen />).getByText('No stores yet. Add the places you shop.')).toBeTruthy();
  });

  it('adds a store with its name trimmed, then clears the field', async () => {
    withStores([]);
    mockCreateStoreAsync.mockResolvedValueOnce({ OHID: 3 });
    const { getByPlaceholderText, getByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. Tesco'), '  Tesco ');
    fireEvent.press(getByText('Add'));

    await waitFor(() => expect(mockCreateStoreAsync).toHaveBeenCalledWith({ name: 'Tesco' }));
    await waitFor(() => expect(getByPlaceholderText('e.g. Tesco').props.value).toBe(''));
  });

  it('rejects a blank name', async () => {
    withStores([]);
    const { getByPlaceholderText, getByText, findByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g. Tesco'), '   ');
    fireEvent.press(getByText('Add'));

    expect(await findByText('Store name is required')).toBeTruthy();
    expect(mockCreateStoreAsync).not.toHaveBeenCalled();
  });

  it('shows why adding failed', () => {
    withStores([], { isError: true, error: new Error('This household already has a store with that name.') });
    expect(render(<HouseholdStoresScreen />).getByText('This household already has a store with that name.')).toBeTruthy();
  });
});
