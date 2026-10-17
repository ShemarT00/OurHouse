-- 004_auth_users.sql
-- Key users by their Supabase auth ID and create the profile row automatically.
--   * "USER".USER_ID becomes the auth.users UUID (and MEMB_USER_ID / NOTI_USER_ID follow)
--   * USER_INVITE_CODE is dropped: invite codes belong to households (#5)
--   * A trigger on auth.users inserts the "USER" row at signup, using the
--     first_name / last_name the client passes as signUp() metadata. This works
--     with "Confirm email" on, when the client has no session yet.
--   * Row Level Security: a user can read and update only their own row
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

-- Existing rows are disposable test data; BIGINT ids cannot become UUIDs.
-- Cascades to MEMBER and NOTIFICATION, which reference "USER".
TRUNCATE "USER" CASCADE;

ALTER TABLE MEMBER DROP CONSTRAINT IF EXISTS member_memb_user_id_fkey;
ALTER TABLE NOTIFICATION DROP CONSTRAINT IF EXISTS notification_noti_user_id_fkey;

ALTER TABLE "USER" DROP COLUMN IF EXISTS USER_INVITE_CODE;
ALTER TABLE "USER" ALTER COLUMN USER_ID DROP IDENTITY IF EXISTS;
ALTER TABLE "USER" ALTER COLUMN USER_ID TYPE UUID USING gen_random_uuid();
ALTER TABLE "USER"
    ADD CONSTRAINT user_user_id_auth_fkey
    FOREIGN KEY (USER_ID) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE MEMBER ALTER COLUMN MEMB_USER_ID TYPE UUID USING gen_random_uuid();
ALTER TABLE MEMBER
    ADD CONSTRAINT member_memb_user_id_fkey
    FOREIGN KEY (MEMB_USER_ID) REFERENCES "USER"(USER_ID) ON DELETE CASCADE;

ALTER TABLE NOTIFICATION ALTER COLUMN NOTI_USER_ID TYPE UUID USING gen_random_uuid();
ALTER TABLE NOTIFICATION
    ADD CONSTRAINT notification_noti_user_id_fkey
    FOREIGN KEY (NOTI_USER_ID) REFERENCES "USER"(USER_ID) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- Create the profile row when a Supabase auth user is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public."USER" (USER_ID, USER_EMAIL, USER_NAME)
    VALUES (
        NEW.id,
        NEW.email,
        trim(
            coalesce(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' ||
            coalesce(NEW.raw_user_meta_data ->> 'last_name', '')
        )
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security: users see and edit only themselves.
-- No INSERT policy: only the trigger above creates rows.
-- ---------------------------------------------------------------------------
ALTER TABLE "USER" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_select_own ON "USER";
CREATE POLICY user_select_own ON "USER"
    FOR SELECT TO authenticated
    USING (USER_ID = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_update_own ON "USER";
CREATE POLICY user_update_own ON "USER"
    FOR UPDATE TO authenticated
    USING (USER_ID = (SELECT auth.uid()))
    WITH CHECK (USER_ID = (SELECT auth.uid()));

COMMIT;
