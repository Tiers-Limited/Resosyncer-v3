/*
  # Support Platform Settings (Global)

  1. New table
    - support_platform_settings (singleton row: id = 1)
    - customer_support_live_chat_enabled boolean toggle for all tenants

  2. Security
    - Any authenticated user can read
    - Only superadmin/super_admin can insert/update
*/

CREATE TABLE IF NOT EXISTS public.support_platform_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  customer_support_live_chat_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_support_platform_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_platform_settings_updated_at ON public.support_platform_settings;
CREATE TRIGGER trg_support_platform_settings_updated_at
BEFORE UPDATE ON public.support_platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_support_platform_settings_updated_at();

INSERT INTO public.support_platform_settings (id, customer_support_live_chat_enabled)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.support_platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_platform_settings_select ON public.support_platform_settings;
CREATE POLICY support_platform_settings_select
ON public.support_platform_settings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS support_platform_settings_insert ON public.support_platform_settings;
CREATE POLICY support_platform_settings_insert
ON public.support_platform_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND me.role IN ('superadmin', 'super_admin')
  )
);

DROP POLICY IF EXISTS support_platform_settings_update ON public.support_platform_settings;
CREATE POLICY support_platform_settings_update
ON public.support_platform_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND me.role IN ('superadmin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND me.role IN ('superadmin', 'super_admin')
  )
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_platform_settings;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

