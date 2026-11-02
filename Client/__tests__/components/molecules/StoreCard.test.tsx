import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StoreCard } from '@/components/molecules/StoreCard';
import type { Retailer, Store } from '@/types';

const store = (overrides: Partial<Store> = {}): Store => ({
  OHID: 3, name: 'Big Tesco', householdId: 5, createdAt: '', retailerKey: null, website: null, ...overrides,
});

const tesco: Retailer = {
  key: 'tesco', name: 'Tesco', homepage: 'https://www.tesco.com', searchUrl: null, retired: false,
};

describe('StoreCard', () => {
  it('names the retailer a store is linked to', () => {
    const { getByText } = render(<StoreCard store={store({ retailerKey: 'tesco' })} retailer={tesco} onEdit={jest.fn()} />);
    expect(getByText('Shops at Tesco')).toBeTruthy();
  });

  it("shows a store's own website without its scheme", () => {
    const { getByText } = render(
      <StoreCard store={store({ website: 'https://www.cornershop.co.uk' })} onEdit={jest.fn()} />,
    );
    expect(getByText('www.cornershop.co.uk')).toBeTruthy();
  });

  it('says when a store has no link, including a retired retailer', () => {
    expect(render(<StoreCard store={store()} onEdit={jest.fn()} />).getByText('No link')).toBeTruthy();
    expect(render(<StoreCard store={store({ retailerKey: 'gone' })} onEdit={jest.fn()} />).getByText('No link')).toBeTruthy();
  });

  it('opens the store for editing', () => {
    const onEdit = jest.fn();
    const { getByLabelText } = render(<StoreCard store={store()} onEdit={onEdit} />);

    fireEvent.press(getByLabelText('Edit Big Tesco'));

    expect(onEdit).toHaveBeenCalled();
  });
});
