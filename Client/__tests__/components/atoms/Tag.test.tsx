import React from 'react';
import { render } from '@testing-library/react-native';
import { Tag } from '@/components/atoms/Tag';

describe('Tag', () => {
  it.each(['neutral', 'info'] as const)('shows its label (%s)', (variant) => {
    const { getByText } = render(<Tag label="Muted" variant={variant} />);
    expect(getByText('Muted')).toBeTruthy();
  });
});
