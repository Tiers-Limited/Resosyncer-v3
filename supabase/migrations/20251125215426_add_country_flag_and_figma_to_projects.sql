/*
  # Add Country Flag and Figma Link to Projects

  1. Changes
    - Add `country_flag` column to `projects` table
      - Stores country flag emoji (e.g., 🇺🇸, 🇬🇧, 🇨🇦)
      - Type: text
      - Nullable: yes
      - Default: null
    
    - Add `figma_link` column to `projects` table
      - Stores Figma design file URL
      - Type: text
      - Nullable: yes
      - Default: null

  2. Notes
    - Country flag will be displayed as an icon beside project name
    - Figma link allows teams to quickly access design files
    - Both fields are optional
*/

-- Add country flag column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'country_flag'
  ) THEN
    ALTER TABLE projects ADD COLUMN country_flag text;
  END IF;
END $$;

-- Add figma link column to projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'figma_link'
  ) THEN
    ALTER TABLE projects ADD COLUMN figma_link text;
  END IF;
END $$;
