import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import NotificationsScreen from '@/app/(app)/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { ItemEvent } from '@/types';
import type { Notification } from '@/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

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
  changes: [],
  read: false,
  createdAt: '2026-10-29T10:00:00Z',
  ...overrides,
});

const mockRefetch = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();

const withInbox = (notifications: Notification[], isLoading = false) =>
  mockUseNotifications.mockReturnValue({
    notifications,
    isLoading,
    unreadCount: notifications.filter((n) => !n.read).length,
    refetch: mockRefetch,
    isRefetching: false,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    isMarkingAllRead: false,
  });

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

  it('refreshes the inbox when pulled down', () => {
    withInbox([notification(1, 'Milk')]);

    const { UNSAFE_getByType } = render(<NotificationsScreen />);
    UNSAFE_getByType(FlatList).props.onRefresh();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner while the inbox loads', () => {
    withInbox([], true);

    const { queryByText } = render(<NotificationsScreen />);

    expect(queryByText('No notifications.')).toBeNull();
  });

  it('tapping a notification marks it read and opens its shopping list', () => {
    withInbox([notification(1, 'Milk')]);

    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Alex added Milk'));

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/list/[id]', params: { id: 3, householdId: 5 } });
  });

  it('tapping a removed item still opens its shopping list', () => {
    withInbox([notification(1, 'Milk', { event: ItemEvent.REMOVED, sentence: 'Alex removed Milk', itemId: null })]);

    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Alex removed Milk'));

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/list/[id]', params: { id: 3, householdId: 5 } });
  });

  it('tapping a notification whose list was deleted only marks it read', () => {
    withInbox([notification(1, 'Milk', { listId: null, itemId: null })]);

    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Alex added Milk'));

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('tapping a read notification opens its list without marking it again', () => {
    withInbox([notification(1, 'Milk', { read: true })]);

    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Alex added Milk'));

    expect(mockMarkRead).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('marks all read, offered only while something is unread', () => {
    withInbox([notification(1, 'Milk')]);
    const { getByText } = render(<NotificationsScreen />);
    fireEvent.press(getByText('Mark all read'));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);

    withInbox([notification(1, 'Milk', { read: true })]);
    const { queryByText } = render(<NotificationsScreen />);
    expect(queryByText('Mark all read')).toBeNull();
  });
});
