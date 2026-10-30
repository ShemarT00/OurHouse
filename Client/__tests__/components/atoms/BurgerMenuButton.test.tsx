import React from 'react';
import { render } from '@testing-library/react-native';
import { BurgerMenuButton } from '@/components/atoms';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('BurgerMenuButton', () => {
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
});
