-- 011_added_notifications.sql
-- "Added" notifications (#24): when a member adds an item, every other member
-- of the household gets a notification in their inbox reading
-- "<first name> added <item>".
--   * NOTIFICATION is reshaped to hold one item event for one recipient. The
--     shopping list and item links are cleared, not cascaded, when those rows
--     are deleted, so a notification outlives the item it describes.
--   * A trigger on ITEM creates the notifications in the same transaction as the
--     change (ADR 0001). It sits alongside item_broadcast_change from 010.
--   * Row Level Security: a member reads only their own notifications, and no
--     one can insert them directly; only the trigger creates them.
-- Edited, Bought, Un-bought and Removed events extend the trigger in later migrations.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Reshape NOTIFICATION. Nothing has ever written a notification, so any rows
-- are test data; remove them so the new columns can be NOT NULL.
-- The type code (meant for CODESTYPE) and its description are replaced by
-- NOTI_EVENT, and NOTI_MESSAGE by NOTI_SENTENCE.
-- ---------------------------------------------------------------------------
DELETE FROM NOTIFICATION;

ALTER TABLE NOTIFICATION
    DROP COLUMN IF EXISTS NOTI_TYPE,
    DROP COLUMN IF EXISTS NOTI_TYPE_DESC,
    DROP COLUMN IF EXISTS NOTI_MESSAGE,
    ADD COLUMN IF NOT EXISTS NOTI_HOUSEHOLD_ID BIGINT       NOT NULL REFERENCES HOUSEHOLD(HOUS_ID)    ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS NOTI_LIST_ID      BIGINT       NULL     REFERENCES SHOPPINGLIST(SHOP_ID) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS NOTI_ITEM_ID      BIGINT       NULL     REFERENCES ITEM(ITEM_ID)         ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS NOTI_ACTOR_ID     UUID         NULL     REFERENCES "USER"(USER_ID)       ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS NOTI_EVENT        VARCHAR(10)  NOT NULL,
    ADD COLUMN IF NOT EXISTS NOTI_ITEM_NAME    VARCHAR(255) NOT NULL,
    ADD COLUMN IF NOT EXISTS NOTI_SENTENCE     TEXT         NOT NULL;

ALTER TABLE NOTIFICATION DROP CONSTRAINT IF EXISTS NOTIFICATION_EVENT_KNOWN;
ALTER TABLE NOTIFICATION ADD CONSTRAINT NOTIFICATION_EVENT_KNOWN
    CHECK (NOTI_EVENT IN ('added', 'edited', 'bought', 'unbought', 'removed'));

-- The inbox: one member's notifications, newest first
CREATE INDEX IF NOT EXISTS NOTIFICATION_INBOX
    ON NOTIFICATION (NOTI_USER_ID, NOTI_CREATED_AT DESC);

-- ---------------------------------------------------------------------------
-- Record the item event and notify every other member of the household.
-- The actor is the signed-in user; with no one signed in (SQL editor, service
-- key) the actor is "Someone" and every member is notified.
-- SECURITY DEFINER so the trigger can read MEMBER and SHOPPINGLIST and write
-- NOTIFICATION, which members themselves cannot insert into.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_item_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_household_id BIGINT;
    v_actor_name TEXT;
    v_sentence TEXT;
BEGIN
    SELECT s.shop_household_id INTO v_household_id
    FROM public.shoppinglist s
    WHERE s.shop_id = NEW.item_list_id;

    SELECT NULLIF(btrim(m.memb_first_name), '') INTO v_actor_name
    FROM public.member m
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id = v_actor_id;

    v_sentence := coalesce(v_actor_name, 'Someone') || ' added ' || NEW.item_name;

    INSERT INTO public.notification (
        noti_user_id, noti_household_id, noti_list_id, noti_item_id,
        noti_actor_id, noti_event, noti_item_name, noti_sentence
    )
    SELECT m.memb_user_id, v_household_id, NEW.item_list_id, NEW.item_id,
           v_actor_id, 'added', NEW.item_name, v_sentence
    FROM public.member m
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id IS DISTINCT FROM v_actor_id;

    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_item_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS item_notify_event ON ITEM;
CREATE TRIGGER item_notify_event
    AFTER INSERT ON ITEM
    FOR EACH ROW EXECUTE FUNCTION public.notify_item_event();

-- ---------------------------------------------------------------------------
-- Row Level Security: a member sees only their own notifications.
-- No INSERT/UPDATE/DELETE policies: only the trigger creates notifications,
-- and marking them read comes with #28.
-- ---------------------------------------------------------------------------
ALTER TABLE NOTIFICATION ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_select_own ON NOTIFICATION;
CREATE POLICY notification_select_own ON NOTIFICATION
    FOR SELECT TO authenticated
    USING (NOTI_USER_ID = (SELECT auth.uid()));

COMMIT;
