/**
 * Realtime Service
 * Live change events from Supabase Realtime, on private channels the database
 * broadcasts to:
 *   - "list:<id>": item changes, joinable only by members of the list's
 *     household (database/migrations/010_live_item_updates.sql);
 *   - "inbox:<user id>": new notifications, joinable only by that member
 *     (database/migrations/016_live_inbox.sql).
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./config";

/** Call onChange on every broadcast on a private channel. Returns a function that unsubscribes. */
const subscribeToPrivateChannel = (topic: string, onChange: () => void): (() => void) => {
  let channel: RealtimeChannel | null = null;
  let closed = false;

  // Private channels are authorised with the signed-in user's access token
  supabase.realtime
    .setAuth()
    .then(() => {
      if (closed) return;
      channel = supabase
        .channel(topic, { config: { private: true } })
        .on("broadcast", { event: "*" }, () => onChange())
        .subscribe();
    })
    .catch((error: unknown) => console.warn("Live updates unavailable:", error));

  return () => {
    closed = true;
    if (channel) supabase.removeChannel(channel);
  };
};

/**
 * Call onChange whenever any member adds, edits, ticks or deletes an item on
 * this list. Returns a function that unsubscribes.
 */
export const subscribeToListItems = (listId: string, onChange: () => void): (() => void) =>
  subscribeToPrivateChannel(`list:${listId}`, onChange);

/**
 * Call onNew whenever the signed-in member receives a new notification.
 * Returns a function that unsubscribes.
 */
export const subscribeToInbox = (userId: string, onNew: () => void): (() => void) =>
  subscribeToPrivateChannel(`inbox:${userId}`, onNew);
