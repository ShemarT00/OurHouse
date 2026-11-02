import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getUserProfile, updateUserProfile } from '@/services/user';
import type { User } from '@/types';

jest.mock('@/services/user', () => ({ getUserProfile: jest.fn(), updateUserProfile: jest.fn() }));
jest.mock('@/services/api', () => ({ throwIfError: (response: { data: unknown }) => response.data }));

const user = (name: string): User => ({ OHID: 'u1', name, email: 'jane@example.com', createdAt: '' });
const ok = (data: User) => ({ data });

describe('useUserProfile', () => {
  it('shows the saved name as soon as the save succeeds, without waiting for a refetch', async () => {
    (getUserProfile as jest.Mock).mockResolvedValueOnce(ok(user('Jane Doe')));
    (updateUserProfile as jest.Mock).mockResolvedValueOnce(ok(user('New Name')));
    // Hold back any refetch after saving, so only the save's own response can show the new name
    let finishRefetch = () => {};
    (getUserProfile as jest.Mock).mockReturnValue(
      new Promise((resolve) => { finishRefetch = () => resolve(ok(user('New Name'))); }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(() => useUserProfile(), { wrapper });
    await waitFor(() => expect(result.current.profile?.name).toBe('Jane Doe'));

    await act(() => result.current.updateProfileAsync({ name: 'New Name' }));

    await waitFor(() => expect(result.current.profile?.name).toBe('New Name'));

    finishRefetch();
    unmount();
    queryClient.clear();
  });
});
