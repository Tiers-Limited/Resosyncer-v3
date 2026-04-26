-- Add payment detail fields to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS budget_model text DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS rate_type text DEFAULT 'per_hour',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Optional constraints for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_budget_model_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_budget_model_check
      CHECK (budget_model IN ('fixed', 'hourly', 'milestone_based'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_billing_type_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_billing_type_check
      CHECK (billing_type IN ('one_time', 'recurring'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_rate_type_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_rate_type_check
      CHECK (rate_type IN ('per_hour', 'per_task'));
  END IF;
END $$;
