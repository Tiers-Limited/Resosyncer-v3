-- External project import (Jira / Asana / Trello) — client approval + admin execution

CREATE TABLE IF NOT EXISTS public.project_import_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('jira', 'asana', 'trello', 'json')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_client', 'approved', 'importing', 'imported', 'rejected', 'failed')),
  client_email text,
  approval_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  mapped_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_snapshot jsonb,
  rejection_reason text,
  error_message text,
  created_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_import_requests_tenant_id
  ON public.project_import_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_import_requests_status
  ON public.project_import_requests (status);
CREATE INDEX IF NOT EXISTS idx_project_import_requests_token
  ON public.project_import_requests (approval_token);

ALTER TABLE public.project_import_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins and PMs can view import requests"
  ON public.project_import_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = project_import_requests.tenant_id
      AND p.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Tenant admins and PMs can insert import requests"
  ON public.project_import_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = project_import_requests.tenant_id
      AND p.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Tenant admins and PMs can update import requests"
  ON public.project_import_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = project_import_requests.tenant_id
      AND p.role IN ('admin', 'project_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = project_import_requests.tenant_id
      AND p.role IN ('admin', 'project_manager')
    )
  );

CREATE POLICY "Tenant admins and PMs can delete import requests"
  ON public.project_import_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = project_import_requests.tenant_id
      AND p.role IN ('admin', 'project_manager')
    )
  );

-- Client preview (token only — no auth)
CREATE OR REPLACE FUNCTION public.get_project_import_for_client(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'source', r.source,
    'status', r.status,
    'client_email', r.client_email,
    'mapped_payload', r.mapped_payload,
    'created_at', r.created_at
  )
  FROM public.project_import_requests r
  WHERE r.approval_token = p_token
    AND r.status IN ('pending_client', 'approved', 'importing', 'imported', 'rejected')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_import_for_client(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.client_approve_project_import(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.project_import_requests;
BEGIN
  UPDATE public.project_import_requests
  SET status = 'approved', updated_at = now()
  WHERE approval_token = p_token AND status = 'pending_client'
  RETURNING * INTO r;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_not_pending');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', r.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_approve_project_import(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.client_reject_project_import(p_token text, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.project_import_requests;
BEGIN
  UPDATE public.project_import_requests
  SET
    status = 'rejected',
    rejection_reason = COALESCE(NULLIF(trim(p_reason), ''), NULL),
    updated_at = now()
  WHERE approval_token = p_token AND status = 'pending_client'
  RETURNING * INTO r;
  IF r.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found_or_not_pending');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', r.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_reject_project_import(text, text) TO anon, authenticated;

-- Ensure projects has tenant_id / requirements (older DBs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.projects
      ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS requirements text;

-- ticket_attachments (used by app; safe if already present)
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text,
  file_size bigint,
  file_type text,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id
  ON public.ticket_attachments (ticket_id);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_attachments_select_pm" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_select_pm"
  ON public.ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      JOIN public.projects p ON p.id = t.project_id
      WHERE t.id = ticket_attachments.ticket_id
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id = auth.uid()
          AND pr.role IN ('admin', 'project_manager')
          AND pr.tenant_id = p.tenant_id
        )
        OR t.assigned_to = auth.uid()
        OR t.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "ticket_attachments_insert_pm" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_insert_pm"
  ON public.ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
      AND pr.role IN ('admin', 'project_manager')
    )
  );

DROP POLICY IF EXISTS "ticket_attachments_delete_pm" ON public.ticket_attachments;
CREATE POLICY "ticket_attachments_delete_pm"
  ON public.ticket_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
      AND pr.role IN ('admin', 'project_manager')
    )
  );
