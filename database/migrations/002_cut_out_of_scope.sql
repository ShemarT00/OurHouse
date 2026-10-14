-- 002_cut_out_of_scope.sql
-- Remove schema the app does not use:
--   * USER_SESSION: Supabase Auth manages sessions
--   * SHOP_TYPE_CODE: personal lists are out of scope; every list belongs to the household
-- Run against the Supabase project via the SQL editor or supabase CLI

DROP TABLE IF EXISTS USER_SESSION;

ALTER TABLE SHOPPINGLIST DROP COLUMN IF EXISTS SHOP_TYPE_CODE;
