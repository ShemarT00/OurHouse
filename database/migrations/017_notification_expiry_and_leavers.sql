-- 017_notification_expiry_and_leavers.sql
-- Notification expiry and leavers (#30):
--   * public.delete_expired_notifications() deletes notifications older than
--     30 days, and a nightly pg_cron job runs it. The inbox already hides them
--     (Server/notifications/NotifDAO.py, INBOX_DAYS), so a missed run never
--     shows a stale notification. Keep the two 30-day limits in step.
--   * When a membership is deleted, that member's notifications for that
--     household are deleted too, since they can no longer open its lists.
--     Their notifications for other households stay.
-- Run against the Supabase project via the SQL editor or supabase CLI

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------------
-- Delete notifications older than 30 days; returns how many were deleted.
-- Only the cron job (as postgres) and the service key may run it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM public.notification
    WHERE noti_created_at < now() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_expired_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expired_notifications() TO service_role;

-- Every night at 03:00 UTC. Scheduling an existing job name replaces it, so
-- re-running this migration does not add a second job.
SELECT cron.schedule(
    'delete-expired-notifications',
    '0 3 * * *',
    'SELECT public.delete_expired_notifications()'
);

-- ---------------------------------------------------------------------------
-- A member who leaves loses their notifications for that household.
-- SECURITY DEFINER because members cannot delete notifications themselves.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_leavers_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.notification n
    WHERE n.noti_user_id = OLD.memb_user_id
      AND n.noti_household_id = OLD.memb_household_id;
    RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_leavers_notifications() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS member_delete_notifications ON MEMBER;
CREATE TRIGGER member_delete_notifications
    AFTER DELETE ON MEMBER
    FOR EACH ROW EXECUTE FUNCTION public.delete_leavers_notifications();

COMMIT;
