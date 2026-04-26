ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS fixed_price numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_units numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recurring_cycles integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recurring_interval text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS milestone_plan jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS project_total_amount numeric(12,2) DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_recurring_interval_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_recurring_interval_check
      CHECK (recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly'));
  END IF;
END $$;
