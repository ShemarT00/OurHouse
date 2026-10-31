import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveNotifications, NOTIFICATIONS_KEY, NOTIFICATIONS_COUNT_KEY } from '@/hooks/useNotifications';
import { subscribeToInbox } from '@/services/realtime';

jest.mock('@/services/realtime', () => ({ subscribeToInbox: jest.fn() }));
jest.mock('@/services/notification', () => ({}));
jest.mock('@/services/api', () => ({ throwIfError: jest.fn() }));

const mockSubscribe = subscribeToInbox as jest.Mock;
const mockUnsubscribe = jest.fn();

const setup = (userId: string | undefined) => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(({ id }: { id: string | undefined }) => useLiveNotifications(id), {
    wrapper,
    initialProps: { id: userId },
  });
  return { ...hook, queryClient };
};

describe('useLiveNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
  });

  it('refreshes the inbox and the unread count when a notification arrives', () => {
    const { queryClient } = setup('sam');
    queryClient.setQueryData(NOTIFICATIONS_KEY, []);
    queryClient.setQueryData(NOTIFICATIONS_COUNT_KEY, { count: 0 });

    expect(mockSubscribe).toHaveBeenCalledWith('sam', expect.any(Function));
    mockSubscribe.mock.calls[0][1]();

    expect(queryClient.getQueryState(NOTIFICATIONS_KEY)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(NOTIFICATIONS_COUNT_KEY)?.isInvalidated).toBe(true);
  });

  it('unsubscribes on sign-out', () => {
    const { rerender } = setup('sam');

    rerender({ id: undefined });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe while signed out', () => {
    setup(undefined);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
