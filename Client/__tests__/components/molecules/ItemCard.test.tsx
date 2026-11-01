import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ItemCard } from '@/components/molecules/ItemCard';
import { Priority } from '@/types';
import type { Item } from '@/types';

const item = (overrides: Partial<Item> = {}): Item => ({
  OHID: 1,
  name: 'Milk',
  listId: 3,
  priority: Priority.HIGH,
  storeId: null,
  quantity: 2,
  notes: null,
  bought: false,
  createdAt: '2026-10-27T00:00:00Z',
  ...overrides,
});

describe('ItemCard', () => {
  it("shows the item's name, quantity and urgency badge", () => {
    const { getByText } = render(<ItemCard item={item()} />);

    expect(getByText(/Milk/)).toBeTruthy();
    expect(getByText(/× 2/)).toBeTruthy();
    expect(getByText('High')).toBeTruthy();
  });

  it('shows a badge for items with no priority and leaves out a missing quantity', () => {
    const { getByText, queryByText } = render(<ItemCard item={item({ priority: Priority.NONE, quantity: null })} />);

    expect(getByText('No priority')).toBeTruthy();
    expect(queryByText(/×/)).toBeNull();
  });

  it('shows notes when present', () => {
    const { getByText } = render(<ItemCard item={item({ notes: 'semi-skimmed' })} />);
    expect(getByText('semi-skimmed')).toBeTruthy();
  });

  it("shows the item's store when it has one", () => {
    const { getByText, queryByText, rerender } = render(<ItemCard item={item({ storeId: 7 })} storeName="Tesco" />);
    expect(getByText('at Tesco')).toBeTruthy();

    rerender(<ItemCard item={item()} />);
    expect(queryByText(/^at /)).toBeNull();
  });

  it("shows no ↗ and is not a link when the item's store has no link", () => {
    const { getByText, queryByRole } = render(<ItemCard item={item({ storeId: 7 })} storeName="Tesco" />);

    expect(getByText('at Tesco')).toBeTruthy();
    expect(queryByRole('link')).toBeNull();
  });

  it("opens a linked store from its own line, separately from opening the item", () => {
    const onPress = jest.fn();
    const onOpenStore = jest.fn();
    const { getByRole, getByText } = render(
      <ItemCard item={item({ storeId: 7 })} storeName="Tesco" onOpenStore={onOpenStore} onPress={onPress} />,
    );

    expect(getByText('at Tesco ↗')).toBeTruthy();
    fireEvent.press(getByRole('link'));

    expect(onOpenStore).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ticks the item off from its checkbox, separately from opening it', () => {
    const onPress = jest.fn();
    const onToggleBought = jest.fn();
    const { getByRole } = render(<ItemCard item={item()} onPress={onPress} onToggleBought={onToggleBought} />);

    fireEvent.press(getByRole('checkbox'));

    expect(onToggleBought).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
