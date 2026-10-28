-- 009_stores.sql
-- Stores (#9): each household keeps its own list of stores, and an item can
-- name the store it is bought from. Row Level Security limits stores to
-- members of their household (is_member() from 005), and an item may only
-- point at a store from its own list's household.
-- Renaming and deleting stores are not part of #9, so there are no UPDATE or
-- DELETE policies on STORE: those requests are refused.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- ---------------------------------------------------------------------------
-- Stores belong to a household. Existing stores have no household and no one
-- can reach them, so remove them (ITEM_STORE_ID is ON DELETE SET NULL).
-- ---------------------------------------------------------------------------
DELETE FROM STORE;

ALTER TABLE STORE ADD COLUMN IF NOT EXISTS STOR_HOUSEHOLD_ID BIGINT NOT NULL REFERENCES HOUSEHOLD(HOUS_ID) ON DELETE CASCADE;

-- Store names are required; trimmed length 1-255 (the column is VARCHAR(255))
ALTER TABLE STORE DROP CONSTRAINT IF EXISTS STORE_NAME_NOT_BLANK;
ALTER TABLE STORE ADD CONSTRAINT STORE_NAME_NOT_BLANK CHECK (length(btrim(STOR_NAME)) > 0);

-- One store per name in a household, ignoring case and surrounding spaces
CREATE UNIQUE INDEX IF NOT EXISTS STORE_HOUSEHOLD_NAME_UNIQUE
    ON STORE (STOR_HOUSEHOLD_ID, lower(btrim(STOR_NAME)));

-- ---------------------------------------------------------------------------
-- Is this store (if any) in the same household as this list?
-- SECURITY DEFINER so it can read STORE/SHOPPINGLIST regardless of their policies.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_in_list_household(p_store_id BIGINT, p_list_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p_store_id IS NULL OR EXISTS (
        SELECT 1
        FROM public.store st
        JOIN public.shoppinglist s ON s.shop_household_id = st.stor_household_id
        WHERE st.stor_id = p_store_id
          AND s.shop_id = p_list_id
    );
$$;

REVOKE EXECUTE ON FUNCTION public.store_in_list_household(BIGINT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.store_in_list_household(BIGINT, BIGINT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security on STORE: members of the store's household only
-- ---------------------------------------------------------------------------
ALTER TABLE STORE ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_select_member ON STORE;
CREATE POLICY store_select_member ON STORE
    FOR SELECT TO authenticated
    USING (public.is_member(STOR_HOUSEHOLD_ID));

DROP POLICY IF EXISTS store_insert_member ON STORE;
CREATE POLICY store_insert_member ON STORE
    FOR INSERT TO authenticated
    WITH CHECK (public.is_member(STOR_HOUSEHOLD_ID));

-- ---------------------------------------------------------------------------
-- ITEM (from 008): an item's store must come from its list's household
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS item_insert_member ON ITEM;
CREATE POLICY item_insert_member ON ITEM
    FOR INSERT TO authenticated
    WITH CHECK (public.is_list_member(ITEM_LIST_ID)
                AND public.store_in_list_household(ITEM_STORE_ID, ITEM_LIST_ID));

DROP POLICY IF EXISTS item_update_member ON ITEM;
CREATE POLICY item_update_member ON ITEM
    FOR UPDATE TO authenticated
    USING (public.is_list_member(ITEM_LIST_ID))
    WITH CHECK (public.is_list_member(ITEM_LIST_ID)
                AND public.store_in_list_household(ITEM_STORE_ID, ITEM_LIST_ID));

COMMIT;
