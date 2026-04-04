/*
  # Support attachments and thread payload improvements

  - Allow attachments on support live chat and ticket replies
  - Allow optional text when attachment exists
  - Allow attachment metadata on support tickets at creation time
*/

ALTER TABLE IF EXISTS public.support_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint,
  ADD COLUMN IF NOT EXISTS attachment_type text;

ALTER TABLE IF EXISTS public.support_messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE IF EXISTS public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_content_or_attachment_check;

ALTER TABLE IF EXISTS public.support_messages
  ADD CONSTRAINT support_messages_content_or_attachment_check
  CHECK (
    nullif(trim(coalesce(content, '')), '') IS NOT NULL
    OR attachment_url IS NOT NULL
  );

ALTER TABLE IF EXISTS public.support_tickets
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint,
  ADD COLUMN IF NOT EXISTS attachment_type text;

ALTER TABLE IF EXISTS public.support_ticket_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size bigint,
  ADD COLUMN IF NOT EXISTS attachment_type text;

ALTER TABLE IF EXISTS public.support_ticket_messages
  ALTER COLUMN message DROP NOT NULL;

ALTER TABLE IF EXISTS public.support_ticket_messages
  DROP CONSTRAINT IF EXISTS support_ticket_messages_content_or_attachment_check;

ALTER TABLE IF EXISTS public.support_ticket_messages
  ADD CONSTRAINT support_ticket_messages_content_or_attachment_check
  CHECK (
    nullif(trim(coalesce(message, '')), '') IS NOT NULL
    OR attachment_url IS NOT NULL
  );
