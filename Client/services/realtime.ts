/**
 * Realtime Service
 * Live change events from Supabase Realtime. Item changes are broadcast by the
 * database on the private channel "list:<id>", which only members of the
 * list's household can join (database/migrations/010_live_item_updates.sql).
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./config";

/**
 * Call onChange whenever any member adds, edits, ticks or deletes an item on
 * this list. Returns a function that unsubscribes.
 */
export const subscribeToListItems = (
  listId: string,
  onChange: () => void
): (() => void) => {
  let channel: RealtimeChannel | null = null;
  let closed = false;

  // Private channels are authorised with the signed-in user's access token
  supabase.realtime
    .setAuth()
    .then(() => {
      if (closed) return;
      channel = supabase
        .channel(`list:${listId}`, { config: { private: true } })
        .on("broadcast", { event: "*" }, () => onChange())
        .subscribe();
    })
    .catch((error: unknown) => console.warn("Live updates unavailable:", error));

  return () => {
    closed = true;
    if (channel) supabase.removeChannel(channel);
  };
};
