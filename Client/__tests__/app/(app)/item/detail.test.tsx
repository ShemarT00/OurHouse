import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ItemDetailScreen from '@/app/(app)/item/[id]';
import { useStores } from '@/hooks/useStores';
import { Priority } from '@/types';
import type { Item, Retailer, Store } from '@/types';

const mockOpenLink = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ id: '9', householdId: '5', listId: '3' }),
}));

const mockItem: Item = {
  OHID: 9, name: 'Oat milk', listId: 3, priority: Priority.NONE, storeId: 7,
  quantity: null, notes: null, bought: false, createdAt: '',
};
const mutation = { isPending: false, isError: false, error: null };

jest.mock('@/hooks/useItems', () => ({
  useItems: () => ({
    items: [mockItem], isLoading: false, updateItemAsync: jest.fn(), removeItemAsync: jest.fn(),
    updateMutation: mutation, deleteMutation: mutation, isRemoving: false,
  }),
}));

const mockRetailers: Retailer[] = [
  {
    key: 'tesco', name: 'Tesco', homepage: 'https://www.tesco.com',
    searchUrl: 'https://www.tesco.com/groceries/en-GB/search?query={query}', retired: false,
  },
  { key: 'coop', name: 'Co-op', homepage: 'https://www.coop.co.uk', searchUrl: null, retired: false },
];

jest.mock('@/hooks/useRetailers', () => ({ useRetailers: () => ({ retailers: mockRetailers }) }));
jest.mock('@/hooks/useStores', () => ({ useStores: jest.fn() }));
jest.mock('@/utils/openLink', () => ({ openLink: (url: string) => mockOpenLink(url) }));

const withStore = (overrides: Partial<Store>) =>
  (useStores as jest.Mock).mockReturnValue({
    stores: [{ OHID: 7, name: 'Big Tesco', householdId: 5, createdAt: '', retailerKey: null, website: null, ...overrides }],
  });

describe('ItemDetailScreen store link', () => {
  beforeEach(() => jest.clearAllMocks());

  it('searches the store for this item when its retailer can search', () => {
    withStore({ retailerKey: 'tesco' });
    const { getByText } = render(<ItemDetailScreen />);

    fireEvent.press(getByText('Search Big Tesco for this ↗'));

    expect(mockOpenLink).toHaveBeenCalledWith('https://www.tesco.com/groceries/en-GB/search?query=Oat%20milk');
  });

  it('opens the homepage when only a homepage is available', () => {
    withStore({ name: 'Co-op', retailerKey: 'coop' });
    const { getByText, rerender } = render(<ItemDetailScreen />);

    fireEvent.press(getByText('Open Co-op ↗'));
    expect(mockOpenLink).toHaveBeenLastCalledWith('https://www.coop.co.uk');

    withStore({ name: 'Market', website: 'https://market.example' });
    rerender(<ItemDetailScreen />);
    fireEvent.press(getByText('Open Market ↗'));
    expect(mockOpenLink).toHaveBeenLastCalledWith('https://market.example');
  });

  it('offers nothing when the store has no link, or a retired retailer', () => {
    withStore({});
    const { queryByRole, rerender } = render(<ItemDetailScreen />);
    expect(queryByRole('link')).toBeNull();

    withStore({ retailerKey: 'gone' });
    rerender(<ItemDetailScreen />);
    expect(queryByRole('link')).toBeNull();
  });
});
