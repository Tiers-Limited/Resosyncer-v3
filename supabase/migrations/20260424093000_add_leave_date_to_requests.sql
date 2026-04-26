-- Add a dedicated leave date for leave requests.
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS leave_date date;

-- Optional index for filtering/reporting leave requests by date.
CREATE INDEX IF NOT EXISTS idx_requests_leave_date
  ON public.requests (leave_date);
