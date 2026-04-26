/*
  # Add direct AI document link columns to projects

  User-requested model:
  - Store one link per AI document type directly on projects
    instead of relying on documents table rows.
*/

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_plan_doc_link text,
  ADD COLUMN IF NOT EXISTS prd_doc_link text,
  ADD COLUMN IF NOT EXISTS risk_management_doc_link text;

