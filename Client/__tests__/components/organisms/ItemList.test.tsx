import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ItemList } from '@/components/organisms/ItemList';
import { Priority } from '@/types';
import type { Item, Retailer, Store } from '@/types';

const item = (OHID: number, name: string, storeId: number | null): Item => ({
  OHID, name, listId: 3, priority: Priority.NONE, storeId, quantity: null, notes: null, bought: false, createdAt: '',
});

const store = (OHID: number, name: string, overrides: Partial<Store> = {}): Store => ({
  OHID, name, householdId: 5, createdAt: '', retailerKey: null, website: null, ...overrides,
});

const retailers: Retailer[] = [{
  key: 'tesco',
  name: 'Tesco',
  homepage: 'https://www.tesco.com',
  searchUrl: 'https://www.tesco.com/groceries/en-GB/search?query={query}',
  retired: false,
}];

const stores = [
  store(1, 'Big Tesco', { retailerKey: 'tesco' }),
  store(2, 'Market', { website: 'https://market.example' }),
  store(3, 'Corner shop'),
  store(4, 'Old Shop', { retailerKey: 'gone' }), // retired, so not in retailers
];

describe('ItemList', () => {
  it("opens each linked store for its item: a retailer's search, or the store's website", () => {
    const onOpenStore = jest.fn();
    const onItemPress = jest.fn();
    const { getByLabelText } = render(
      <ItemList
        items={[item(1, 'Oat milk & honey', 1), item(2, 'Apples', 2)]}
        stores={stores}
        retailers={retailers}
        onOpenStore={onOpenStore}
        onItemPress={onItemPress}
      />,
    );

    fireEvent.press(getByLabelText('Open Big Tesco'));
    fireEvent.press(getByLabelText('Open Market'));

    expect(onOpenStore.mock.calls).toEqual([
      ['https://www.tesco.com/groceries/en-GB/search?query=Oat%20milk%20%26%20honey'],
      ['https://market.example'],
    ]);
    expect(onItemPress).not.toHaveBeenCalled();
  });

  it('does not make stores with no link, or a retired retailer, tappable', () => {
    const { getByText, queryByRole } = render(
      <ItemList
        items={[item(1, 'Bread', 3), item(2, 'Eggs', 4)]}
        stores={stores}
        retailers={retailers}
        onOpenStore={jest.fn()}
      />,
    );

    expect(getByText('at Corner shop')).toBeTruthy();
    expect(getByText('at Old Shop')).toBeTruthy();
    expect(queryByRole('link')).toBeNull();
  });
});
