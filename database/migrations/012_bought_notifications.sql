-- 012_bought_notifications.sql
-- Bought and Un-bought notifications (#25): a save that only ticks an item as
-- bought tells every other member "<first name> bought <item>"; a save that
-- only unticks it tells them "<first name> un-ticked <item>".
--   * notify_item_event() (011) now also runs after each update of ITEM.
--   * A save that changes the bought flag together with any other field is an
--     Edited event, and so is a save that changes other fields only; both come
--     with #26 and send nothing yet. A save that changes nothing sends nothing.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Work out the item event, then notify every other member of the household.
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
    v_event TEXT;
    v_verb TEXT;
    v_household_id BIGINT;
    v_actor_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event := 'added';
        v_verb := 'added';
    -- Only the bought flag changed: compare every other column, so a column
    -- added to ITEM later still counts as an edit
    ELSIF NEW.item_bought IS DISTINCT FROM OLD.item_bought
          AND to_jsonb(NEW) - 'item_bought' = to_jsonb(OLD) - 'item_bought' THEN
        v_event := CASE WHEN NEW.item_bought THEN 'bought' ELSE 'unbought' END;
        v_verb := CASE WHEN NEW.item_bought THEN 'bought' ELSE 'un-ticked' END;
    ELSE
        -- Edited comes with #26; a save that changes nothing is no event
        RETURN NULL;
    END IF;

    SELECT s.shop_household_id INTO v_household_id
    FROM public.shoppinglist s
    WHERE s.shop_id = NEW.item_list_id;

    SELECT NULLIF(btrim(m.memb_first_name), '') INTO v_actor_name
    FROM public.member m
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id = v_actor_id;

    INSERT INTO public.notification (
        noti_user_id, noti_household_id, noti_list_id, noti_item_id,
        noti_actor_id, noti_event, noti_item_name, noti_sentence
    )
    SELECT m.memb_user_id, v_household_id, NEW.item_list_id, NEW.item_id,
           v_actor_id, v_event, NEW.item_name,
           coalesce(v_actor_name, 'Someone') || ' ' || v_verb || ' ' || NEW.item_name
    FROM public.member m
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id IS DISTINCT FROM v_actor_id;

    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_item_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS item_notify_event ON ITEM;
CREATE TRIGGER item_notify_event
    AFTER INSERT OR UPDATE ON ITEM
    FOR EACH ROW EXECUTE FUNCTION public.notify_item_event();

COMMIT;
