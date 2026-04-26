CREATE TABLE IF NOT EXISTS public.signed_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  envelope_id text NOT NULL,
  title text NOT NULL DEFAULT 'Agreement',
  doc_type text,
  signer_name text,
  signer_email text,
  signed_document_url text NOT NULL,
  source text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signed_contracts_user_envelope_unique UNIQUE (user_id, envelope_id)
);

CREATE INDEX IF NOT EXISTS idx_signed_contracts_user_signed_at
  ON public.signed_contracts (user_id, signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_signed_contracts_tenant_signed_at
  ON public.signed_contracts (tenant_id, signed_at DESC);

ALTER TABLE public.signed_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own signed contracts" ON public.signed_contracts;
CREATE POLICY "Users can read own signed contracts"
  ON public.signed_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own signed contracts" ON public.signed_contracts;
CREATE POLICY "Users can insert own signed contracts"
  ON public.signed_contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own signed contracts" ON public.signed_contracts;
CREATE POLICY "Users can update own signed contracts"
  ON public.signed_contracts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_signed_contracts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_signed_contracts_updated_at ON public.signed_contracts;
CREATE TRIGGER trg_signed_contracts_updated_at
BEFORE UPDATE ON public.signed_contracts
FOR EACH ROW
EXECUTE FUNCTION public.set_signed_contracts_updated_at();
