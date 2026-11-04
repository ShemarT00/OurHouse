-- 020_switched_off_events.sql
-- Switch off kinds of item event (#63, ADR 0004): an account can choose not to
-- be notified about some kinds of item event, in every household it belongs to.
--   * "USER" gains USER_SWITCHED_OFF_EVENTS: the events turned off, as item
--     event names (NOTI_EVENT values). Empty by default, so every existing and
--     new account has everything on. The app always switches Bought and
--     Un-bought together, but they are stored separately.
--   * notify_item_event() (019) also skips recipients who have switched off
--     the event, and still skips muted memberships. Nothing is created while
--     an event is off, so switching it back on delivers nothing missed.
--   * The account changes the list through its own row; the existing
--     user_update_own policy (004) already limits that to the signed-in user.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

ALTER TABLE "USER"
    ADD COLUMN IF NOT EXISTS USER_SWITCHED_OFF_EVENTS TEXT[] NOT NULL DEFAULT '{}'
    CONSTRAINT user_switched_off_events_known
        CHECK (USER_SWITCHED_OFF_EVENTS <@ ARRAY['added', 'edited', 'bought', 'unbought', 'removed']::TEXT[]);

-- ---------------------------------------------------------------------------
-- Work out the item event, then notify every other member of the household
-- who has neither muted it nor switched the event off (unchanged from 019
-- apart from that).
-- The actor is the signed-in user; with no one signed in (SQL editor, service
-- key) the actor is "Someone" and every member is notified.
-- SECURITY DEFINER so the trigger can read MEMBER, "USER", SHOPPINGLIST and
-- STORE and write NOTIFICATION, which members themselves cannot insert into.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_item_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_item public.item%ROWTYPE;  -- the item as it now is, or as it was before removal
    v_event TEXT;
    v_detail TEXT;  -- the sentence after the actor's name
    v_changes JSONB := '[]'::jsonb;
    v_only TEXT;    -- the changed field, when exactly one changed
    v_household_id BIGINT;
    v_actor_name TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_item := OLD;
    ELSE
        v_item := NEW;
    END IF;

    SELECT s.shop_household_id INTO v_household_id
    FROM public.shoppinglist s
    WHERE s.shop_id = v_item.item_list_id;

    -- The list (or its household) is being deleted with its items: no one removed them
    IF v_household_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_event := 'added';
        v_detail := 'added ' || NEW.item_name;
    ELSIF TG_OP = 'DELETE' THEN
        v_event := 'removed';
        v_detail := 'removed ' || OLD.item_name;
    ELSE
        -- Each changed field, in sentence order, with old and new as members see them
        IF NEW.item_list_id IS DISTINCT FROM OLD.item_list_id THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'list',
                'old', (SELECT s.shop_name FROM public.shoppinglist s WHERE s.shop_id = OLD.item_list_id),
                'new', (SELECT s.shop_name FROM public.shoppinglist s WHERE s.shop_id = NEW.item_list_id)));
        END IF;
        IF NEW.item_name IS DISTINCT FROM OLD.item_name THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'name', 'old', OLD.item_name, 'new', NEW.item_name));
        END IF;
        IF NEW.item_quantity IS DISTINCT FROM OLD.item_quantity THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'quantity',
                'old', coalesce(OLD.item_quantity::TEXT, 'Empty'),
                'new', coalesce(NEW.item_quantity::TEXT, 'Empty')));
        END IF;
        IF NEW.item_priority IS DISTINCT FROM OLD.item_priority THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'priority',
                'old', public.item_priority_label(OLD.item_priority),
                'new', public.item_priority_label(NEW.item_priority)));
        END IF;
        -- Clearing the store because the store was deleted is not a member's edit
        IF NEW.item_store_id IS DISTINCT FROM OLD.item_store_id
           AND NOT (NEW.item_store_id IS NULL
                    AND NOT EXISTS (SELECT 1 FROM public.store st WHERE st.stor_id = OLD.item_store_id)) THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'store',
                'old', coalesce((SELECT st.stor_name FROM public.store st WHERE st.stor_id = OLD.item_store_id), 'Empty'),
                'new', coalesce((SELECT st.stor_name FROM public.store st WHERE st.stor_id = NEW.item_store_id), 'Empty')));
        END IF;
        IF NEW.item_notes IS DISTINCT FROM OLD.item_notes THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'notes', 'old', NULL, 'new', NULL));
        END IF;
        IF NEW.item_bought IS DISTINCT FROM OLD.item_bought THEN
            v_changes := v_changes || jsonb_build_array(jsonb_build_object(
                'field', 'bought',
                'old', CASE WHEN OLD.item_bought THEN 'Bought' ELSE 'Not bought' END,
                'new', CASE WHEN NEW.item_bought THEN 'Bought' ELSE 'Not bought' END));
        END IF;

        IF jsonb_array_length(v_changes) = 0 THEN
            RETURN NULL;
        END IF;

        IF jsonb_array_length(v_changes) = 1 THEN
            v_only := v_changes -> 0 ->> 'field';
        END IF;

        IF v_only = 'bought' THEN
            v_event := CASE WHEN NEW.item_bought THEN 'bought' ELSE 'unbought' END;
            v_detail := CASE WHEN NEW.item_bought THEN 'bought ' ELSE 'un-ticked ' END || NEW.item_name;
            v_changes := '[]'::jsonb;
        ELSE
            v_event := 'edited';
            IF v_only = 'list' THEN
                v_detail := format('moved %s from %s to %s',
                                   NEW.item_name, v_changes -> 0 ->> 'old', v_changes -> 0 ->> 'new');
            ELSIF v_only = 'notes' THEN
                v_detail := 'updated the notes on ' || NEW.item_name;
            ELSE
                SELECT 'changed ' || NEW.item_name || ': ' || string_agg(
                    CASE c ->> 'field'
                        WHEN 'list' THEN format('moved from %s to %s', c ->> 'old', c ->> 'new')
                        WHEN 'notes' THEN 'updated the notes'
                        WHEN 'bought' THEN CASE WHEN NEW.item_bought THEN 'ticked as bought' ELSE 'un-ticked' END
                        ELSE format('%s %s → %s', c ->> 'field', c ->> 'old', c ->> 'new')
                    END, ', ' ORDER BY t.ord)
                INTO v_detail
                FROM jsonb_array_elements(v_changes) WITH ORDINALITY AS t(c, ord);
            END IF;
        END IF;
    END IF;

    SELECT NULLIF(btrim(m.memb_first_name), '') INTO v_actor_name
    FROM public.member m
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id = v_actor_id;

    INSERT INTO public.notification (
        noti_user_id, noti_household_id, noti_list_id, noti_item_id,
        noti_actor_id, noti_event, noti_item_name, noti_changes, noti_sentence
    )
    SELECT m.memb_user_id, v_household_id, v_item.item_list_id,
           CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE v_item.item_id END,  -- a removed item has no row to link to
           v_actor_id, v_event, v_item.item_name, v_changes,
           coalesce(v_actor_name, 'Someone') || ' ' || v_detail
    FROM public.member m
    JOIN public."USER" u ON u.user_id = m.memb_user_id
    WHERE m.memb_household_id = v_household_id
      AND m.memb_user_id IS DISTINCT FROM v_actor_id
      AND NOT m.memb_muted
      AND NOT (v_event = ANY (u.user_switched_off_events));

    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_item_event() FROM PUBLIC, anon, authenticated;

-- The trigger (014) already runs notify_item_event(); replacing the function is enough.

COMMIT;
