import React from 'react';
import { render } from '@testing-library/react-native';
import { PriorityBadge } from '@/components/atoms/PriorityBadge';
import { Priority } from '@/types';

describe('PriorityBadge', () => {
  it.each([
    [Priority.NONE, 'No priority'],
    [Priority.LOW, 'Low'],
    [Priority.MEDIUM, 'Medium'],
    [Priority.HIGH, 'High'],
  ])('renders a badge for priority %i', (priority, label) => {
    const { getByText } = render(<PriorityBadge priority={priority} />);
    expect(getByText(label)).toBeTruthy();
  });
});
