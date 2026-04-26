-- Extend finance tracking for manual invoice/expense/payout workflows

-- 1) Extend existing payments table to support invoice tracking fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS paid_date date,
  ADD COLUMN IF NOT EXISTS proof_url text,
  ADD COLUMN IF NOT EXISTS proof_path text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Backfill tenant_id when possible from creator profile
UPDATE public.payments p
SET tenant_id = pr.tenant_id
FROM public.profiles pr
WHERE p.tenant_id IS NULL
  AND p.created_by = pr.id
  AND pr.tenant_id IS NOT NULL;

-- Normalize old status values
UPDATE public.payments
SET status = 'pending'
WHERE status = 'not_paid';

-- Keep status valid for manual tracking
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_status_check'
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_status_check;
  END IF;

  ALTER TABLE public.payments
    ADD CONSTRAINT payments_status_check
    CHECK (status IN ('paid', 'pending', 'overdue', 'not_paid'));
END $$;

-- 2) Manual expense records
CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'other',
  spent_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_expenses_category_check
    CHECK (category IN ('salaries', 'tools', 'marketing', 'ops', 'other'))
);

-- 3) Manual payout records
CREATE TABLE IF NOT EXISTS public.finance_manual_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  payee_name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payout_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'scheduled',
  payment_method text DEFAULT 'bank_transfer',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_manual_payouts_status_check
    CHECK (status IN ('scheduled', 'paid', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_manual_payouts ENABLE ROW LEVEL SECURITY;

-- Shared access logic: owner/admin/PM in same tenant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_expenses'
      AND policyname = 'finance_expenses_select_policy'
  ) THEN
    CREATE POLICY finance_expenses_select_policy
      ON public.finance_expenses
      FOR SELECT
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_expenses.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_expenses'
      AND policyname = 'finance_expenses_insert_policy'
  ) THEN
    CREATE POLICY finance_expenses_insert_policy
      ON public.finance_expenses
      FOR INSERT
      TO authenticated
      WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_expenses.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_expenses'
      AND policyname = 'finance_expenses_update_policy'
  ) THEN
    CREATE POLICY finance_expenses_update_policy
      ON public.finance_expenses
      FOR UPDATE
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_expenses.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      )
      WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_expenses.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_expenses'
      AND policyname = 'finance_expenses_delete_policy'
  ) THEN
    CREATE POLICY finance_expenses_delete_policy
      ON public.finance_expenses
      FOR DELETE
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_expenses.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_payouts'
      AND policyname = 'finance_manual_payouts_select_policy'
  ) THEN
    CREATE POLICY finance_manual_payouts_select_policy
      ON public.finance_manual_payouts
      FOR SELECT
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_manual_payouts.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_payouts'
      AND policyname = 'finance_manual_payouts_insert_policy'
  ) THEN
    CREATE POLICY finance_manual_payouts_insert_policy
      ON public.finance_manual_payouts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_manual_payouts.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_payouts'
      AND policyname = 'finance_manual_payouts_update_policy'
  ) THEN
    CREATE POLICY finance_manual_payouts_update_policy
      ON public.finance_manual_payouts
      FOR UPDATE
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_manual_payouts.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      )
      WITH CHECK (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_manual_payouts.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_payouts'
      AND policyname = 'finance_manual_payouts_delete_policy'
  ) THEN
    CREATE POLICY finance_manual_payouts_delete_policy
      ON public.finance_manual_payouts
      FOR DELETE
      TO authenticated
      USING (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.tenant_id = finance_manual_payouts.tenant_id
            AND p.role IN ('admin', 'project_manager')
        )
      );
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_tenant_id ON public.finance_expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_category ON public.finance_expenses(category);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_spent_at ON public.finance_expenses(spent_at);

CREATE INDEX IF NOT EXISTS idx_finance_manual_payouts_tenant_id ON public.finance_manual_payouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_manual_payouts_status ON public.finance_manual_payouts(status);
CREATE INDEX IF NOT EXISTS idx_finance_manual_payouts_payout_date ON public.finance_manual_payouts(payout_date);
