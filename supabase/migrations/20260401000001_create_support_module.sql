/*
  # Support Module (Live Chat + Ticketing)

  1. New Tables
    - support_conversations
    - support_messages
    - support_tickets
    - support_ticket_messages

  2. Security
    - RLS enabled on all support tables
    - Superadmin can access all tenants
    - Admin/PM can access their tenant support data
    - Any authenticated user can submit a problem ticket for their tenant
*/

CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  initiated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_superadmin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text DEFAULT 'Support Chat',
  channel_type text NOT NULL DEFAULT 'live_chat',
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_conversations_status_check
    CHECK (status IN ('open', 'closed')),
  CONSTRAINT support_conversations_channel_type_check
    CHECK (channel_type IN ('live_chat'))
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  submitted_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  source text NOT NULL DEFAULT 'customer_support',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT support_tickets_source_check
    CHECK (source IN ('customer_support', 'report_problem')),
  CONSTRAINT support_tickets_priority_check
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT support_tickets_status_check
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_tenant_id
  ON public.support_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_last_message_at
  ON public.support_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id_created_at
  ON public.support_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id
  ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
  ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id_created_at
  ON public.support_ticket_messages(ticket_id, created_at);

CREATE OR REPLACE FUNCTION public.set_support_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_conversations_updated_at ON public.support_conversations;
CREATE TRIGGER trg_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_support_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_support_updated_at();

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_conversations_select ON public.support_conversations;
CREATE POLICY support_conversations_select
ON public.support_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = support_conversations.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_conversations_insert ON public.support_conversations;
CREATE POLICY support_conversations_insert
ON public.support_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  initiated_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = support_conversations.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_conversations_update ON public.support_conversations;
CREATE POLICY support_conversations_update
ON public.support_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = support_conversations.tenant_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = support_conversations.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_messages_select ON public.support_messages;
CREATE POLICY support_messages_select
ON public.support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_conversations c
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE c.id = support_messages.conversation_id
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = c.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_messages_insert ON public.support_messages;
CREATE POLICY support_messages_insert
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.support_conversations c
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE c.id = support_messages.conversation_id
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = c.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR support_tickets.submitted_by = auth.uid()
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = support_tickets.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_tickets_insert ON public.support_tickets;
CREATE POLICY support_tickets_insert
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR (
          me.role IN ('admin', 'project_manager', 'employee')
          AND me.tenant_id = support_tickets.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_tickets_update ON public.support_tickets;
CREATE POLICY support_tickets_update
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR support_tickets.submitted_by = auth.uid()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR support_tickets.submitted_by = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS support_ticket_messages_select ON public.support_ticket_messages;
CREATE POLICY support_ticket_messages_select
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE t.id = support_ticket_messages.ticket_id
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR t.submitted_by = auth.uid()
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = t.tenant_id
        )
      )
  )
);

DROP POLICY IF EXISTS support_ticket_messages_insert ON public.support_ticket_messages;
CREATE POLICY support_ticket_messages_insert
ON public.support_ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    JOIN public.profiles me ON me.id = auth.uid()
    WHERE t.id = support_ticket_messages.ticket_id
      AND (
        me.role IN ('superadmin', 'super_admin')
        OR t.submitted_by = auth.uid()
        OR (
          me.role IN ('admin', 'project_manager')
          AND me.tenant_id = t.tenant_id
        )
      )
  )
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
