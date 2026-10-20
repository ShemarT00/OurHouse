-- 005_households.sql
-- Create a household (#5):
--   * Each household gets a unique, shareable invite code and records who created it
--   * create_household() creates the household and the creator's admin membership
--     in one transaction (called by the server with the user's token)
--   * Row Level Security: only members can see a household and its membership rows
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- Households with no members cannot be reached by anyone once RLS is on
-- (migration 004 cleared MEMBER); remove them so the new columns can be NOT NULL.
DELETE FROM HOUSEHOLD h
WHERE NOT EXISTS (SELECT 1 FROM MEMBER m WHERE m.MEMB_HOUSEHOLD_ID = h.HOUS_ID);

ALTER TABLE HOUSEHOLD
    ADD COLUMN IF NOT EXISTS HOUS_INVITE_CODE VARCHAR(8) NOT NULL UNIQUE,
    ADD COLUMN IF NOT EXISTS HOUS_CREATED_BY UUID REFERENCES "USER"(USER_ID) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Invite codes: 8 characters from an alphabet without look-alikes (no 0/O, 1/I).
-- 32 symbols divide 256 evenly, so byte % 32 is unbiased.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
    alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    random_bytes BYTEA := extensions.gen_random_bytes(8);
    code TEXT := '';
BEGIN
    FOR i IN 0..7 LOOP
        code := code || substr(alphabet, (get_byte(random_bytes, i) % 32) + 1, 1);
    END LOOP;
    RETURN code;
END;
$$;

-- ---------------------------------------------------------------------------
-- Is the signed-in user a member of this household?
-- SECURITY DEFINER so policies on MEMBER can use it without recursing into themselves.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_member(p_household_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.member m
        WHERE m.memb_household_id = p_household_id
          AND m.memb_user_id = (SELECT auth.uid())
    );
$$;

-- ---------------------------------------------------------------------------
-- Create a household and make the caller its admin member, atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_household(p_name TEXT)
RETURNS public.household
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_name TEXT := btrim(p_name);
    v_metadata JSONB;
    v_household public.household;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;
    IF v_name IS NULL OR length(v_name) = 0 OR length(v_name) > 255 THEN
        RAISE EXCEPTION 'Household name must be 1-255 characters' USING ERRCODE = '22023';
    END IF;

    -- Retry on the (unlikely) chance the random invite code is already taken
    FOR attempt IN 1..5 LOOP
        BEGIN
            INSERT INTO public.household (hous_name, hous_invite_code, hous_created_by)
            VALUES (v_name, public.generate_invite_code(), v_user_id)
            RETURNING * INTO v_household;
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            IF attempt = 5 THEN
                RAISE;
            END IF;
        END;
    END LOOP;

    -- Member names come from the sign-up metadata, as in handle_new_user() (004)
    SELECT raw_user_meta_data INTO v_metadata FROM auth.users WHERE id = v_user_id;

    INSERT INTO public.member (memb_user_id, memb_household_id, memb_is_admin, memb_first_name, memb_last_name)
    VALUES (
        v_user_id,
        v_household.hous_id,
        TRUE,
        coalesce(v_metadata ->> 'first_name', ''),
        coalesce(v_metadata ->> 'last_name', '')
    );

    RETURN v_household;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_member(BIGINT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_household(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_household(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: members only.
-- No INSERT/UPDATE/DELETE policies: households and memberships are created
-- through create_household() (and joining by code in #6).
-- ---------------------------------------------------------------------------
ALTER TABLE HOUSEHOLD ENABLE ROW LEVEL SECURITY;
ALTER TABLE MEMBER ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS household_select_member ON HOUSEHOLD;
CREATE POLICY household_select_member ON HOUSEHOLD
    FOR SELECT TO authenticated
    USING (public.is_member(HOUS_ID));

DROP POLICY IF EXISTS member_select_same_household ON MEMBER;
CREATE POLICY member_select_same_household ON MEMBER
    FOR SELECT TO authenticated
    USING (public.is_member(MEMB_HOUSEHOLD_ID));

COMMIT;
