-- 010_live_item_updates.sql
-- Live updates (#10): every add, edit, tick or delete of an item is broadcast
-- on the private Realtime channel "list:<list id>". Row Level Security on
-- realtime.messages lets only members of the list's household join that
-- channel, so non-members receive no change events.
-- Clients subscribe with supabase.channel('list:<id>', { config: { private: true } }).
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Broadcast each item change to its list's channel.
-- SECURITY DEFINER so the trigger can write to realtime.messages.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.broadcast_item_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'list:' || COALESCE(NEW.item_list_id, OLD.item_list_id)::text,  -- topic
        TG_OP,                                                           -- event: INSERT / UPDATE / DELETE
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        OLD
    );
    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.broadcast_item_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS item_broadcast_change ON ITEM;
CREATE TRIGGER item_broadcast_change
    AFTER INSERT OR UPDATE OR DELETE ON ITEM
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_item_change();

-- ---------------------------------------------------------------------------
-- Who may receive a list's broadcasts: members of its household only.
-- The CASE checks the topic is "list:<digits>" before casting it.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS list_members_receive_item_changes ON realtime.messages;
CREATE POLICY list_members_receive_item_changes ON realtime.messages
    FOR SELECT TO authenticated
    USING (
        realtime.messages.extension = 'broadcast'
        AND CASE
            WHEN (SELECT realtime.topic()) ~ '^list:[0-9]{1,18}$'
                THEN public.is_list_member(substring((SELECT realtime.topic()) FROM 6)::BIGINT)
            ELSE FALSE
        END
    );

COMMIT;
