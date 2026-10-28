import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveItems, itemsKey } from '@/hooks/useItems';
import { subscribeToListItems } from '@/services/realtime';

jest.mock('@/services/realtime', () => ({ subscribeToListItems: jest.fn() }));
jest.mock('@/services/item', () => ({}));
jest.mock('@/services/api', () => ({ throwIfError: jest.fn() }));

const mockSubscribe = subscribeToListItems as jest.Mock;
const mockUnsubscribe = jest.fn();

const setup = (householdId: string, listId: string) => {
  const queryClient = new QueryClient();
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useLiveItems(householdId, listId), { wrapper });
  return { ...hook, invalidate };
};

describe('useLiveItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
  });

  it("refetches the list's items when another member changes one", () => {
    const { invalidate } = setup('5', '3');

    expect(mockSubscribe).toHaveBeenCalledWith('3', expect.any(Function));
    mockSubscribe.mock.calls[0][1]();

    expect(invalidate).toHaveBeenCalledWith({ queryKey: itemsKey('5', '3') });
  });

  it('unsubscribes when the screen closes', () => {
    const { unmount } = setup('5', '3');
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe until the list is known', () => {
    setup('5', '');
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
