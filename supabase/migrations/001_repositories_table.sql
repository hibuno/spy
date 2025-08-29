CREATE TABLE public.repositories (
  id uuid not null default extensions.uuid_generate_v4 (),
  summary character varying null,
  content text null,
  languages character varying null,
  experience character varying null,
  usability character varying null,
  deployment character varying null,
  stars bigint null,
  forks bigint null,
  watching bigint null,
  license character varying null,
  homepage character varying null,
  repository character varying null,
  images jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp without time zone null,
  archived boolean null,
  disabled boolean null,
  open_issues bigint null,
  default_branch character varying null,
  network_count bigint null,
  tags character varying null,
  constraint repositories_pkey primary key (id),
  constraint repositories_repository_key unique (repository)
) TABLESPACE pg_default;

-- Add paper-related columns to repositories table
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS arxiv_url TEXT,
ADD COLUMN IF NOT EXISTS huggingface_url TEXT,
ADD COLUMN IF NOT EXISTS paper_authors TEXT,
ADD COLUMN IF NOT EXISTS paper_abstract TEXT,
ADD COLUMN IF NOT EXISTS paper_scraped_at TIMESTAMP WITH TIME ZONE;

-- Add readme column for storing README content
ALTER TABLE repositories
ADD COLUMN IF NOT EXISTS readme TEXT;

-- Create index on huggingface_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_repositories_huggingface_url ON repositories(huggingface_url);

-- Create index on arxiv_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_repositories_arxiv_url ON repositories(arxiv_url);

-- Create index on paper_scraped_at for tracking when papers were last scraped
CREATE INDEX IF NOT EXISTS idx_repositories_paper_scraped_at ON repositories(paper_scraped_at DESC);

-- Drop the existing policy
DROP POLICY IF EXISTS "allow_anon_update_repositories" ON public.repositories;

-- Create a new, more permissive policy
CREATE POLICY "allow_anon_update_repositories" 
ON public.repositories 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);