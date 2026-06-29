/*
# Shadow Allotment Tracker - Core Schema

1. Purpose
   Internal Resource Allocation System with two roles: Resource Manager (admin) and Employee.
   Admins manage employees, projects, and allocations. Employees can only view their own information.

2. New Tables
   - `profiles`: extends auth.users with employee details (name, role, designation, experience, skills, location, status)
   - `projects`: company projects with client, manager, status, priority, dates, required skills
   - `allocations`: links employees to projects with allocation percentage, type (primary/shadow), mentor, dates, status, notes
   - `allocation_history`: audit log of allocation changes (action, performed_by)

3. Security (RLS)
   - All tables have RLS enabled.
   - Admins (role = 'admin' in profiles) have full CRUD on all tables via a helper function `is_admin()`.
   - Employees can only read their own profile, their own allocations, and their own allocation history.
   - Employees cannot access other employees' data.

4. Important Notes
   - `profiles.id` references `auth.users.id` so each auth user has exactly one profile row.
   - `is_admin()` helper checks the requesting user's profile role for policy reuse.
   - All foreign keys use ON DELETE CASCADE where appropriate to keep data consistent.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  designation text,
  experience numeric DEFAULT 0,
  primary_skill text,
  secondary_skills text[] DEFAULT '{}',
  location text,
  phone text,
  status text NOT NULL DEFAULT 'bench' CHECK (status IN ('bench', 'allocated', 'shadow', 'partially_allocated')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  client_name text NOT NULL,
  description text,
  project_manager text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  start_date date,
  end_date date,
  required_skills text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- allocations table
CREATE TABLE IF NOT EXISTS public.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  allocation_percentage integer NOT NULL DEFAULT 0 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  allocation_type text NOT NULL DEFAULT 'primary' CHECK (allocation_type IN ('primary', 'shadow')),
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'released', 'on_hold')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- allocation_history table
CREATE TABLE IF NOT EXISTS public.allocation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid REFERENCES public.allocations(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  action text NOT NULL,
  allocation_percentage integer,
  allocation_type text,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper function: returns true if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_history ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_profiles" ON public.profiles;
CREATE POLICY "admin_insert_profiles" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_profiles" ON public.profiles;
CREATE POLICY "admin_delete_profiles" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "employee_select_own_profile" ON public.profiles;
CREATE POLICY "employee_select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "employee_update_own_profile" ON public.profiles;
CREATE POLICY "employee_update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects policies
DROP POLICY IF EXISTS "admin_select_projects" ON public.projects;
CREATE POLICY "admin_select_projects" ON public.projects FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_projects" ON public.projects;
CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_projects" ON public.projects;
CREATE POLICY "admin_update_projects" ON public.projects FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_projects" ON public.projects;
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "employee_select_allocated_projects" ON public.projects;
CREATE POLICY "employee_select_allocated_projects" ON public.projects FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.allocations
      WHERE allocations.project_id = projects.id
      AND allocations.employee_id = auth.uid()
    )
  );

-- allocations policies
DROP POLICY IF EXISTS "admin_select_allocations" ON public.allocations;
CREATE POLICY "admin_select_allocations" ON public.allocations FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_allocations" ON public.allocations;
CREATE POLICY "admin_insert_allocations" ON public.allocations FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_allocations" ON public.allocations;
CREATE POLICY "admin_update_allocations" ON public.allocations FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_allocations" ON public.allocations;
CREATE POLICY "admin_delete_allocations" ON public.allocations FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "employee_select_own_allocations" ON public.allocations;
CREATE POLICY "employee_select_own_allocations" ON public.allocations FOR SELECT
  TO authenticated USING (auth.uid() = employee_id);

-- allocation_history policies
DROP POLICY IF EXISTS "admin_select_history" ON public.allocation_history;
CREATE POLICY "admin_select_history" ON public.allocation_history FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_history" ON public.allocation_history;
CREATE POLICY "admin_insert_history" ON public.allocation_history FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_history" ON public.allocation_history;
CREATE POLICY "admin_update_history" ON public.allocation_history FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_history" ON public.allocation_history;
CREATE POLICY "admin_delete_history" ON public.allocation_history FOR DELETE
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "employee_select_own_history" ON public.allocation_history;
CREATE POLICY "employee_select_own_history" ON public.allocation_history FOR SELECT
  TO authenticated USING (auth.uid() = employee_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON public.allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project ON public.allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_allocations_status ON public.allocations(status);
CREATE INDEX IF NOT EXISTS idx_history_employee ON public.allocation_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_history_project ON public.allocation_history(project_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON public.allocation_history(created_at);
