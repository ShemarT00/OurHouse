-- 015_read_notifications.sql
-- Read and unread (#28): a member can mark their own notifications read.
--   * Row Level Security lets a member update only their own notifications.
--   * The read flag is the only column a member can change: UPDATE is granted
--     on NOTI_READ alone, so the sentence, event and links stay as the trigger
--     wrote them.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

REVOKE UPDATE ON NOTIFICATION FROM anon, authenticated;
GRANT UPDATE (NOTI_READ) ON NOTIFICATION TO authenticated;

DROP POLICY IF EXISTS notification_update_own ON NOTIFICATION;
CREATE POLICY notification_update_own ON NOTIFICATION
    FOR UPDATE TO authenticated
    USING (NOTI_USER_ID = (SELECT auth.uid()))
    WITH CHECK (NOTI_USER_ID = (SELECT auth.uid()));

COMMIT;
