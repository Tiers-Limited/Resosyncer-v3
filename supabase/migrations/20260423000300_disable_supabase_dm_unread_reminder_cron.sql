/*
  # Disable Supabase DM Reminder Cron

  We moved unread DM reminder delivery to the Node backend scheduler.
  This migration disables the Supabase-side cron job to prevent duplicate emails.
*/

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dm-unread-reminder-cron') THEN
    PERFORM cron.unschedule('dm-unread-reminder-cron');
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;
