import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BurgerMenuButton } from '@/components/atoms';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('BurgerMenuButton', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the unread count', () => {
    const { getByText, getByLabelText } = render(<BurgerMenuButton unreadCount={3} />);

    expect(getByText('3')).toBeTruthy();
    expect(getByLabelText('Open menu, 3 unread notifications')).toBeTruthy();
  });

  it('shows no badge when nothing is unread', () => {
    const { queryByText, getByLabelText } = render(<BurgerMenuButton unreadCount={0} />);

    expect(queryByText('0')).toBeNull();
    expect(getByLabelText('Open menu')).toBeTruthy();
  });

  it('caps a large count', () => {
    const { getByText } = render(<BurgerMenuButton unreadCount={150} />);

    expect(getByText('99+')).toBeTruthy();
  });

  it.each([
    ['Household', '/(app)/household/create'],
    ['List', { pathname: '/(app)/household/pick', params: { next: 'list' } }],
    ['Item', { pathname: '/(app)/household/pick', params: { next: 'item' } }],
  ])('%s opens where to make one', (label, href) => {
    const { getByLabelText, getByText } = render(<BurgerMenuButton />);

    fireEvent.press(getByLabelText('Open menu'));
    fireEvent.press(getByText(label));

    expect(mockPush).toHaveBeenCalledWith(href, { withAnchor: true });
  });
});
