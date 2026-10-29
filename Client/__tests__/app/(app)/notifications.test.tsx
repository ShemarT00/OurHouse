import React from 'react';
import { render } from '@testing-library/react-native';
import NotificationsScreen from '@/app/(app)/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { ItemEvent } from '@/types';
import type { Notification } from '@/types';

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.Mock;

const notification = (OHID: number, itemName: string, overrides: Partial<Notification> = {}): Notification => ({
  OHID,
  userId: 'sam',
  householdId: 5,
  event: ItemEvent.ADDED,
  itemName,
  sentence: `Alex added ${itemName}`,
  listId: 3,
  itemId: 10 + OHID,
  actorId: 'alex',
  read: false,
  createdAt: '2026-10-29T10:00:00Z',
  ...overrides,
});

const withInbox = (notifications: Notification[], isLoading = false) =>
  mockUseNotifications.mockReturnValue({ notifications, isLoading, unreadCount: 0 });

describe('NotificationsScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows each notification in the order the inbox gives them, newest first', () => {
    withInbox([notification(2, 'Bread'), notification(1, 'Milk')]);

    const { getAllByText } = render(<NotificationsScreen />);

    expect(getAllByText(/^Alex added /).map((node) => node.props.children)).toEqual([
      'Alex added Bread',
      'Alex added Milk',
    ]);
  });

  it('marks only unread notifications as unread', () => {
    withInbox([notification(2, 'Bread'), notification(1, 'Milk', { read: true })]);

    const { getAllByLabelText } = render(<NotificationsScreen />);

    expect(getAllByLabelText('Unread')).toHaveLength(1);
  });

  it('shows the empty state when the inbox is empty', () => {
    withInbox([]);

    const { getByText } = render(<NotificationsScreen />);

    expect(getByText('No notifications.')).toBeTruthy();
  });

  it('shows a spinner while the inbox loads', () => {
    withInbox([], true);

    const { queryByText } = render(<NotificationsScreen />);

    expect(queryByText('No notifications.')).toBeNull();
  });
});
