-- 006_join_household.sql
-- Join a household by invite code (#6).
--   * join_household(code) adds the signed-in user as a (non-admin) member of the
--     household with that code and returns the household
--   * Unknown code: returns no rows (the server answers 404)
--   * Joining again is a no-op: the UNIQUE (MEMB_USER_ID, MEMB_HOUSEHOLD_ID)
--     constraint from 001 plus ON CONFLICT DO NOTHING prevents duplicate memberships
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

CREATE OR REPLACE FUNCTION public.join_household(p_code TEXT)
RETURNS SETOF public.household
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_household public.household;
    v_metadata JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    -- Codes are shown in upper case; accept them typed in any case, with stray spaces
    SELECT * INTO v_household
    FROM public.household
    WHERE hous_invite_code = upper(btrim(p_code));

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Member names come from the sign-up metadata, as in create_household() (005)
    SELECT raw_user_meta_data INTO v_metadata FROM auth.users WHERE id = v_user_id;

    INSERT INTO public.member (memb_user_id, memb_household_id, memb_is_admin, memb_first_name, memb_last_name)
    VALUES (
        v_user_id,
        v_household.hous_id,
        FALSE,
        coalesce(v_metadata ->> 'first_name', ''),
        coalesce(v_metadata ->> 'last_name', '')
    )
    ON CONFLICT (memb_user_id, memb_household_id) DO NOTHING;

    RETURN NEXT v_household;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_household(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_household(TEXT) TO authenticated;

COMMIT;
