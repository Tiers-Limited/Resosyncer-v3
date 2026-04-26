/*
  # Move Unread DM Reminder Scheduling To Backend

  1. New table
    - `dm_unread_reminder_log`
      - Stores one reminder attempt per DM (`message_id` is unique)

  2. Read-status reliability
    - Trigger on `message_read_status` to mark DM rows in `messages` as `is_read = true`
    - Backfills existing rows where read-status exists but `is_read` is still false

  3. Cron
    - Adds `invoke_dm_unread_reminder_cron()` which calls Supabase Edge Function
    - Schedules job `dm-unread-reminder-cron` to run every minute
*/

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.dm_unread_reminder_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  receiver_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response jsonb,
  error_text text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_unread_reminder_log_status
  ON public.dm_unread_reminder_log(status);

CREATE OR REPLACE FUNCTION public.sync_dm_is_read_from_read_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages m
  SET is_read = true
  WHERE m.id = NEW.message_id
    AND m.channel_id IS NULL
    AND m.receiver_id = NEW.user_id
    AND COALESCE(m.is_read, false) = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dm_is_read_from_read_status
  ON public.message_read_status;

CREATE TRIGGER trg_sync_dm_is_read_from_read_status
AFTER INSERT ON public.message_read_status
FOR EACH ROW
EXECUTE FUNCTION public.sync_dm_is_read_from_read_status();

UPDATE public.messages m
SET is_read = true
FROM public.message_read_status rs
WHERE rs.message_id = m.id
  AND m.channel_id IS NULL
  AND m.receiver_id = rs.user_id
  AND COALESCE(m.is_read, false) = false;

CREATE OR REPLACE FUNCTION public.invoke_dm_unread_reminder_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := current_setting('app.settings.supabase_url', true);
BEGIN
  IF COALESCE(v_supabase_url, '') = '' THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/dm-unread-reminder-cron',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"source":"pg_cron"}'::jsonb
  );
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dm-unread-reminder-cron') THEN
    PERFORM cron.unschedule('dm-unread-reminder-cron');
  END IF;

  PERFORM cron.schedule(
    'dm-unread-reminder-cron',
    '* * * * *',
    'SELECT public.invoke_dm_unread_reminder_cron();'
  );
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;
