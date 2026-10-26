-- 007_shopping_lists.sql
-- Shopping lists (#7): Row Level Security so lists are visible to, and can be
-- created by, members of the list's household only (is_member() from 005).
-- Renaming and deleting lists are not part of #7, so there are no UPDATE or
-- DELETE policies: those requests are refused.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- List names are required; trimmed length 1-255 (the column is VARCHAR(255))
ALTER TABLE SHOPPINGLIST DROP CONSTRAINT IF EXISTS SHOPPINGLIST_NAME_NOT_BLANK;
ALTER TABLE SHOPPINGLIST ADD CONSTRAINT SHOPPINGLIST_NAME_NOT_BLANK CHECK (length(btrim(SHOP_NAME)) > 0);

ALTER TABLE SHOPPINGLIST ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shoppinglist_select_member ON SHOPPINGLIST;
CREATE POLICY shoppinglist_select_member ON SHOPPINGLIST
    FOR SELECT TO authenticated
    USING (public.is_member(SHOP_HOUSEHOLD_ID));

DROP POLICY IF EXISTS shoppinglist_insert_member ON SHOPPINGLIST;
CREATE POLICY shoppinglist_insert_member ON SHOPPINGLIST
    FOR INSERT TO authenticated
    WITH CHECK (public.is_member(SHOP_HOUSEHOLD_ID));

COMMIT;
