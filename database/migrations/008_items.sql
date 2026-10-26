-- 008_items.sql
-- Items on shopping lists (#8): Row Level Security so only members of the
-- list's household can see, add, edit or delete its items, plus basic checks
-- on item values.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Value checks (the server validates too; these protect direct database access)
-- ---------------------------------------------------------------------------
ALTER TABLE ITEM DROP CONSTRAINT IF EXISTS ITEM_NAME_NOT_BLANK;
ALTER TABLE ITEM ADD CONSTRAINT ITEM_NAME_NOT_BLANK CHECK (length(btrim(ITEM_NAME)) > 0);

ALTER TABLE ITEM DROP CONSTRAINT IF EXISTS ITEM_QUANTITY_POSITIVE;
ALTER TABLE ITEM ADD CONSTRAINT ITEM_QUANTITY_POSITIVE CHECK (ITEM_QUANTITY IS NULL OR ITEM_QUANTITY > 0);

-- ---------------------------------------------------------------------------
-- Is the signed-in user a member of the household that owns this list?
-- SECURITY DEFINER so it can read SHOPPINGLIST/MEMBER regardless of their policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_list_member(p_list_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.shoppinglist s
        JOIN public.member m ON m.memb_household_id = s.shop_household_id
        WHERE s.shop_id = p_list_id
          AND m.memb_user_id = (SELECT auth.uid())
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_list_member(BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_list_member(BIGINT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: members of the list's household only
-- ---------------------------------------------------------------------------
ALTER TABLE ITEM ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS item_select_member ON ITEM;
CREATE POLICY item_select_member ON ITEM
    FOR SELECT TO authenticated
    USING (public.is_list_member(ITEM_LIST_ID));

DROP POLICY IF EXISTS item_insert_member ON ITEM;
CREATE POLICY item_insert_member ON ITEM
    FOR INSERT TO authenticated
    WITH CHECK (public.is_list_member(ITEM_LIST_ID));

-- WITH CHECK also stops an item being moved onto another household's list
DROP POLICY IF EXISTS item_update_member ON ITEM;
CREATE POLICY item_update_member ON ITEM
    FOR UPDATE TO authenticated
    USING (public.is_list_member(ITEM_LIST_ID))
    WITH CHECK (public.is_list_member(ITEM_LIST_ID));

DROP POLICY IF EXISTS item_delete_member ON ITEM;
CREATE POLICY item_delete_member ON ITEM
    FOR DELETE TO authenticated
    USING (public.is_list_member(ITEM_LIST_ID));

COMMIT;
