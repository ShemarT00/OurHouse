-- 016_live_inbox.sql
-- Live inbox (#29): each new notification is broadcast on its recipient's
-- private Realtime channel "inbox:<user id>", the same pattern as live list
-- updates (010). Row Level Security on realtime.messages lets only that
-- member join the channel, so no one else hears about their notifications.
-- Clients subscribe with supabase.channel('inbox:<id>', { config: { private: true } }).
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Broadcast each new notification to its recipient's channel.
-- SECURITY DEFINER so the trigger can write to realtime.messages.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.broadcast_new_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'inbox:' || NEW.noti_user_id::text,  -- topic
        TG_OP,                               -- event: INSERT
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        NULL
    );
    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.broadcast_new_notification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notification_broadcast_new ON NOTIFICATION;
CREATE TRIGGER notification_broadcast_new
    AFTER INSERT ON NOTIFICATION
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_new_notification();

-- ---------------------------------------------------------------------------
-- Who may receive an inbox's broadcasts: its own member only.
-- Policies are combined with OR, so list channels (010) are unaffected.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS members_receive_own_inbox ON realtime.messages;
CREATE POLICY members_receive_own_inbox ON realtime.messages
    FOR SELECT TO authenticated
    USING (
        realtime.messages.extension = 'broadcast'
        AND (SELECT realtime.topic()) = 'inbox:' || (SELECT auth.uid())::text
    );

COMMIT;
