-- Add project payment detail fields to payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS budget_model text DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS rate_type text DEFAULT 'per_hour';

-- Optional safety checks for allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_budget_model_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_budget_model_check
      CHECK (budget_model IN ('fixed', 'hourly', 'milestone_based'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_billing_type_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_billing_type_check
      CHECK (billing_type IN ('one_time', 'recurring'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_rate_type_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_rate_type_check
      CHECK (rate_type IN ('per_hour', 'per_task'));
  END IF;
END $$;
