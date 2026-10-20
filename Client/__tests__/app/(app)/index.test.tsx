import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/(app)/index';
import { useHouseholds } from '@/hooks/useHouseholds';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useHouseholds', () => ({
  useHouseholds: jest.fn(),
}));

const mockUseHouseholds = useHouseholds as jest.Mock;

const withHouseholds = (households: Array<{ OHID: number; name: string }>) =>
  mockUseHouseholds.mockReturnValue({
    households,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    isRefetching: false,
  });

describe('HomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists the households the user belongs to', () => {
    withHouseholds([
      { OHID: 1, name: 'The Smiths' },
      { OHID: 2, name: 'Flat 4B' },
    ]);

    const { getByText } = render(<HomeScreen />);

    expect(getByText('The Smiths')).toBeTruthy();
    expect(getByText('Flat 4B')).toBeTruthy();
  });

  it('opens a household when it is tapped', () => {
    withHouseholds([{ OHID: 7, name: 'The Smiths' }]);

    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('The Smiths'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/household/[id]', params: { id: 7 } });
  });

  it('shows the empty state when the user has no households', () => {
    withHouseholds([]);

    const { getByText } = render(<HomeScreen />);

    expect(getByText('No households yet.')).toBeTruthy();
  });
});
