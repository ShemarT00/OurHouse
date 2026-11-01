import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RetailerPicker } from '@/components/atoms/RetailerPicker';
import type { Retailer } from '@/types';

const retailer = (key: string, name: string, retired = false): Retailer => ({
  key, name, homepage: `https://${key}.example`, searchUrl: null, retired,
});

const retailers = [retailer('aldi', 'Aldi'), retailer('tesco', 'Tesco'), retailer('gone', 'Gone Ltd', true)];

describe('RetailerPicker', () => {
  it("offers 'No retailer' and each retailer that is not retired", () => {
    const { getByText, queryByText } = render(<RetailerPicker retailers={retailers} value={null} onChange={jest.fn()} />);

    ['No retailer', 'Aldi', 'Tesco'].forEach((name) => expect(getByText(name)).toBeTruthy());
    expect(queryByText('Gone Ltd')).toBeNull();
  });

  it('picks a retailer, or none', () => {
    const onChange = jest.fn();
    const { getByText } = render(<RetailerPicker retailers={retailers} value="aldi" onChange={onChange} />);

    fireEvent.press(getByText('Tesco'));
    fireEvent.press(getByText('No retailer'));

    expect(onChange.mock.calls).toEqual([[retailers[1]], [null]]);
  });

  it('marks the chosen retailer as selected', () => {
    const { getAllByRole } = render(<RetailerPicker retailers={retailers} value="tesco" onChange={jest.fn()} />);
    expect(getAllByRole('radio').map((r) => r.props.accessibilityState.selected)).toEqual([false, false, true]);
  });
});
