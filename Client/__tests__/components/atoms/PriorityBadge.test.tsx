import React from 'react';
import { render } from '@testing-library/react-native';
import { PriorityBadge } from '@/components/atoms/PriorityBadge';

describe('PriorityBadge', () => {
  it('renders "Low" for LOW priority', () => {
    const { getByText } = render(<PriorityBadge priority="LOW" />);
    expect(getByText('Low')).toBeTruthy();
  });

  it('renders "Medium" for MEDIUM priority', () => {
    const { getByText } = render(<PriorityBadge priority="MEDIUM" />);
    expect(getByText('Medium')).toBeTruthy();
  });

  it('renders "High" for HIGH priority', () => {
    const { getByText } = render(<PriorityBadge priority="HIGH" />);
    expect(getByText('High')).toBeTruthy();
  });
});
