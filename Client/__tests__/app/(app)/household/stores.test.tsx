import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HouseholdStoresScreen from '@/app/(app)/household/stores/[id]';
import { useStores } from '@/hooks/useStores';
import type { Retailer, Store } from '@/types';

const mockCreateStoreAsync = jest.fn();
const mockUpdateStoreAsync = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ id: '5' }),
}));

jest.mock('@/hooks/useHouseholds', () => ({
  useHousehold: () => ({ household: { OHID: 5, name: 'The Smiths' } }),
}));

const mockRetailers: Retailer[] = [
  { key: 'aldi', name: 'Aldi', homepage: 'https://www.aldi.co.uk', searchUrl: null, retired: false },
  { key: 'tesco', name: 'Tesco', homepage: 'https://www.tesco.com', searchUrl: null, retired: false },
];

jest.mock('@/hooks/useRetailers', () => ({ useRetailers: () => ({ retailers: mockRetailers }) }));
jest.mock('@/hooks/useStores', () => ({ useStores: jest.fn() }));

const store = (OHID: number, name: string, overrides: Partial<Store> = {}): Store => ({
  OHID, name, householdId: 5, createdAt: '', retailerKey: null, website: null, ...overrides,
});

const mutationState = (overrides = {}) => ({ isPending: false, isError: false, error: null, reset: jest.fn(), ...overrides });

const withStores = (stores: Store[], { create = {}, update = {} } = {}) =>
  (useStores as jest.Mock).mockReturnValue({
    stores,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
    createStoreAsync: mockCreateStoreAsync,
    createMutation: mutationState(create),
    updateStoreAsync: mockUpdateStoreAsync,
    updateMutation: mutationState(update),
  });

const NAME = 'e.g. Tesco';
const WEBSITE = 'e.g. www.cornershop.co.uk';

describe('HouseholdStoresScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists the household's stores with their links", () => {
    withStores([
      store(1, 'Aldi', { retailerKey: 'aldi' }),
      store(2, 'Market', { website: 'https://market.example' }),
      store(3, 'Corner shop'),
    ]);
    const { getByText } = render(<HouseholdStoresScreen />);

    expect(useStores).toHaveBeenCalledWith('5');
    expect(getByText('Shops at Aldi')).toBeTruthy();
    expect(getByText('market.example')).toBeTruthy();
    expect(getByText('No link')).toBeTruthy();
  });

  it('shows an empty state', () => {
    withStores([]);
    expect(render(<HouseholdStoresScreen />).getByText('No stores yet. Add the places you shop.')).toBeTruthy();
  });

  it('adds a store with no link, its name trimmed, then clears the form', async () => {
    withStores([]);
    mockCreateStoreAsync.mockResolvedValueOnce({ OHID: 3 });
    const { getByPlaceholderText, getByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText(NAME), '  Corner shop ');
    fireEvent.press(getByText('Add'));

    await waitFor(() =>
      expect(mockCreateStoreAsync).toHaveBeenCalledWith({ name: 'Corner shop', retailerKey: null, website: null }));
    await waitFor(() => expect(getByPlaceholderText(NAME).props.value).toBe(''));
  });

  it('adds a store linked to a retailer, named after it', async () => {
    withStores([]);
    mockCreateStoreAsync.mockResolvedValueOnce({ OHID: 3 });
    const { getByText } = render(<HouseholdStoresScreen />);

    fireEvent.press(getByText('Tesco'));
    fireEvent.press(getByText('Add'));

    await waitFor(() =>
      expect(mockCreateStoreAsync).toHaveBeenCalledWith({ name: 'Tesco', retailerKey: 'tesco', website: null }));
  });

  it('adds a store with its own website, adding https://', async () => {
    withStores([]);
    mockCreateStoreAsync.mockResolvedValueOnce({ OHID: 3 });
    const { getByPlaceholderText, getByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText(NAME), 'Market');
    fireEvent.changeText(getByPlaceholderText(WEBSITE), 'market.example');
    fireEvent.press(getByText('Add'));

    await waitFor(() => expect(mockCreateStoreAsync).toHaveBeenCalledWith(
      { name: 'Market', retailerKey: null, website: 'https://market.example' }));
  });

  it('rejects a blank name', async () => {
    withStores([]);
    const { getByPlaceholderText, getByText, findByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText(NAME), '   ');
    fireEvent.press(getByText('Add'));

    expect(await findByText('Store name is required')).toBeTruthy();
    expect(mockCreateStoreAsync).not.toHaveBeenCalled();
  });

  it('shows an error under the website when it is not a web address', async () => {
    withStores([]);
    const { getByPlaceholderText, getByText, findByText } = render(<HouseholdStoresScreen />);

    fireEvent.changeText(getByPlaceholderText(NAME), 'Market');
    fireEvent.changeText(getByPlaceholderText(WEBSITE), 'not a website');
    fireEvent.press(getByText('Add'));

    expect(await findByText('Website must be a web address, like www.example.com')).toBeTruthy();
    expect(mockCreateStoreAsync).not.toHaveBeenCalled();
  });

  it('shows why adding failed', () => {
    withStores([], { create: { isError: true, error: new Error('There is already a store called "Tesco"') } });
    expect(render(<HouseholdStoresScreen />).getByText('There is already a store called "Tesco"')).toBeTruthy();
  });

  it("edits a store's name and link", async () => {
    withStores([store(2, 'Market', { website: 'https://market.example' })]);
    mockUpdateStoreAsync.mockResolvedValueOnce({ OHID: 2 });
    const { getByLabelText, getByPlaceholderText, getByText, queryByText } = render(<HouseholdStoresScreen />);

    fireEvent.press(getByLabelText('Edit Market'));
    expect(getByText('Editing Market')).toBeTruthy();
    expect(getByPlaceholderText(NAME).props.value).toBe('Market');
    expect(getByPlaceholderText(WEBSITE).props.value).toBe('https://market.example');

    fireEvent.changeText(getByPlaceholderText(NAME), 'Aldi Hackney');
    fireEvent.press(getByText('Aldi'));
    fireEvent.press(getByText('Save'));

    await waitFor(() => expect(mockUpdateStoreAsync).toHaveBeenCalledWith({
      storeId: 2, data: { name: 'Aldi Hackney', retailerKey: 'aldi', website: null },
    }));
    await waitFor(() => expect(queryByText('Editing Market')).toBeNull());
    expect(mockCreateStoreAsync).not.toHaveBeenCalled();
  });

  it('cancels an edit', () => {
    withStores([store(2, 'Market')]);
    const { getByLabelText, getByPlaceholderText, getByText, queryByText } = render(<HouseholdStoresScreen />);

    fireEvent.press(getByLabelText('Edit Market'));
    fireEvent.press(getByText('Cancel'));

    expect(queryByText('Editing Market')).toBeNull();
    expect(getByPlaceholderText(NAME).props.value).toBe('');
    expect(getByText('Add')).toBeTruthy();
  });

  it('shows a duplicate name when an edit clashes', () => {
    withStores([store(2, 'Market')], {
      update: { isError: true, error: new Error('There is already a store called "Aldi"') },
    });
    const { getByLabelText, getByText } = render(<HouseholdStoresScreen />);

    fireEvent.press(getByLabelText('Edit Market'));

    expect(getByText('There is already a store called "Aldi"')).toBeTruthy();
  });
});
