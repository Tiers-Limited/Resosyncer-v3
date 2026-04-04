/*
  # Add live chat toggle to workspace settings

  Superadmin can control whether tenant admins can use customer support live chat.
*/

ALTER TABLE IF EXISTS public.workspace_settings
ADD COLUMN IF NOT EXISTS customer_support_live_chat_enabled boolean NOT NULL DEFAULT true;
