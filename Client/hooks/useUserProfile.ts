import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, setSwitchedOffEvents } from '@/services/user';
import type { UpdateUserProfile } from '@/services/user';
import { throwIfError } from '@/services/api';
import { ItemEvent } from '@/types';
import type { User } from '@/types';

export const USER_PROFILE_KEY = ['userProfile'] as const;

/** Switching some item events on or off, e.g. Bought and Un-bought together */
export interface EventSwitch {
  events: ItemEvent[];
  on: boolean;
}

const ITEM_EVENTS = Object.values(ItemEvent);

/** A new switched-off list: `switchedOff` with `events` added (off) or removed, in the usual order */
const switchedOffWith = (switchedOff: ItemEvent[], events: ItemEvent[], off: boolean): ItemEvent[] =>
  ITEM_EVENTS.filter((e) => (events.includes(e) ? off : switchedOff.includes(e)));

export const useUserProfile = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: USER_PROFILE_KEY,
    queryFn: () => getUserProfile().then(throwIfError),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfile) =>
      updateUserProfile(data).then(throwIfError),
    // The response is the updated profile, so show it now rather than after a refetch
    onSuccess: (user) => {
      queryClient.setQueryData(USER_PROFILE_KEY, user);
    },
  });

  /**
   * Switch kinds of item event on or off for the account (Switched-off Events).
   * The switch flips straight away and flips back if saving fails. Saves run
   * one at a time, each sending the switches as they then are, so a save that
   * fails is not carried along by the next.
   */
  // The last failed save; kept here because switchMutation only reflects its latest call
  const [switchError, setSwitchError] = useState<Error | null>(null);
  const cachedSwitchedOff = () => queryClient.getQueryData<User>(USER_PROFILE_KEY)?.switchedOffEvents ?? [];
  const cacheSwitchedOff = (events: ItemEvent[], off: boolean) =>
    queryClient.setQueryData<User>(USER_PROFILE_KEY, (old) =>
      old && { ...old, switchedOffEvents: switchedOffWith(old.switchedOffEvents, events, off) });
  const switchMutation = useMutation({
    scope: { id: 'switched-off-events' },
    // Sends every switch as it is when this save's turn comes, not just this change
    mutationFn: (_change: EventSwitch) => setSwitchedOffEvents(cachedSwitchedOff()).then(throwIfError),
    onMutate: async ({ events, on }) => {
      setSwitchError(null);
      await queryClient.cancelQueries({ queryKey: USER_PROFILE_KEY });
      const wasOff = events.filter((e) => cachedSwitchedOff().includes(e));
      cacheSwitchedOff(events, !on);
      return { wasOff };
    },
    // Only these events go back to how they were, so a switch flipped meanwhile keeps its new state
    onError: (error, { events }, context) => {
      cacheSwitchedOff(events, false);
      cacheSwitchedOff(context?.wasOff ?? [], true);
      setSwitchError(error);
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    switchedOffEvents: query.data?.switchedOffEvents ?? [],
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    updateMutation,
    switchEvents: switchMutation.mutate,
    switchEventsAsync: switchMutation.mutateAsync,
    switchError,
    switchMutation,
  };
};
