ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_type text;

UPDATE public.projects
SET project_type = COALESCE(project_type, 'project')
WHERE project_type IS NULL;

ALTER TABLE public.projects
ALTER COLUMN project_type SET DEFAULT 'project';

ALTER TABLE public.projects
ALTER COLUMN project_type SET NOT NULL;

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_project_type_check;

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_type_check
CHECK (project_type IN ('project', 'accelerator', 'poc'));

CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);
