import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StorePicker } from '@/components/atoms/StorePicker';
import type { Store } from '@/types';

const stores: Store[] = [
  { OHID: 7, name: 'Tesco', householdId: 5, createdAt: '', retailerKey: null, website: null },
  { OHID: 8, name: 'Aldi', householdId: 5, createdAt: '', retailerKey: null, website: null },
];

describe('StorePicker', () => {
  it("offers 'Any store' and each of the household's stores", () => {
    const { getByText } = render(<StorePicker stores={stores} value={null} onChange={jest.fn()} />);
    ['Any store', 'Tesco', 'Aldi'].forEach((name) => expect(getByText(name)).toBeTruthy());
  });

  it('picks a store, or none', () => {
    const onChange = jest.fn();
    const { getByText } = render(<StorePicker stores={stores} value={7} onChange={onChange} />);

    fireEvent.press(getByText('Aldi'));
    fireEvent.press(getByText('Any store'));

    expect(onChange.mock.calls).toEqual([[8], [null]]);
  });

  it('marks the chosen store as selected', () => {
    const { getAllByRole } = render(<StorePicker stores={stores} value={7} onChange={jest.fn()} />);
    expect(getAllByRole('radio').map((r) => r.props.accessibilityState.selected)).toEqual([false, true, false]);
  });
});
