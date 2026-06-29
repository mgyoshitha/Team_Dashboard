/*
# Seed Auth Users and Demo Data

1. Purpose
   Create demo auth users (1 admin + several employees) and seed profiles, projects, allocations, and history.

2. Auth Users Created
   - admin@shadow.com / ShadowAdmin123! (admin)
   - alice@shadow.com / ShadowEmp123! (employee)
   - bob@shadow.com / ShadowEmp123! (employee)
   - carol@shadow.com / ShadowEmp123! (employee)
   - david@shadow.com / ShadowEmp123! (employee)
   - eve@shadow.com / ShadowEmp123! (employee)

3. Data
   - profiles for each user
   - 4 demo projects
   - allocations linking employees to projects
   - allocation_history entries
*/

-- Create auth users (admin + employees)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@shadow.com', crypt('ShadowAdmin123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0000-0000-0000-000000000002', 'alice@shadow.com', crypt('ShadowEmp123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0000-0000-0000-000000000003', 'bob@shadow.com', crypt('ShadowEmp123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0000-0000-0000-000000000004', 'carol@shadow.com', crypt('ShadowEmp123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0000-0000-0000-000000000005', 'david@shadow.com', crypt('ShadowEmp123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a0000000-0000-0000-0000-000000000006', 'eve@shadow.com', crypt('ShadowEmp123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Create identities for auth users (required for signIn)
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  email,
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
FROM auth.users
WHERE id IN ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- Seed profiles
INSERT INTO public.profiles (id, email, name, role, designation, experience, primary_skill, secondary_skills, location, phone, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin@shadow.com', 'Sarah Mitchell', 'admin', 'Resource Manager', 12, 'Management', ARRAY['Leadership','Operations'], 'New York', '+1-555-0100', 'allocated'),
  ('a0000000-0000-0000-0000-000000000002', 'alice@shadow.com', 'Alice Johnson', 'employee', 'Senior Software Engineer', 7, 'React', ARRAY['TypeScript','Node.js','GraphQL'], 'San Francisco', '+1-555-0101', 'allocated'),
  ('a0000000-0000-0000-0000-000000000003', 'bob@shadow.com', 'Bob Chen', 'employee', 'Backend Engineer', 5, 'Python', ARRAY['PostgreSQL','Docker','AWS'], 'Austin', '+1-555-0102', 'allocated'),
  ('a0000000-0000-0000-0000-000000000004', 'carol@shadow.com', 'Carol Martinez', 'employee', 'UI/UX Designer', 4, 'Figma', ARRAY['Design Systems','Prototyping'], 'Remote', '+1-555-0103', 'shadow'),
  ('a0000000-0000-0000-0000-000000000005', 'david@shadow.com', 'David Kim', 'employee', 'DevOps Engineer', 6, 'Kubernetes', ARRAY['Terraform','CI/CD','GCP'], 'Seattle', '+1-555-0104', 'bench'),
  ('a0000000-0000-0000-0000-000000000006', 'eve@shadow.com', 'Eve Thompson', 'employee', 'QA Engineer', 3, 'Automation', ARRAY['Selenium','Cypress','Manual Testing'], 'Boston', '+1-555-0105', 'partially_allocated')
ON CONFLICT (id) DO NOTHING;

-- Seed projects
INSERT INTO public.projects (id, project_name, client_name, description, project_manager, status, priority, start_date, end_date, required_skills) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'CargoSprint', 'Logistics Co', 'Logistics optimization platform with real-time tracking', 'Sarah Mitchell', 'active', 'high', '2025-01-15', '2025-12-31', ARRAY['React','Python','PostgreSQL']),
  ('b0000000-0000-0000-0000-000000000002', 'RSNA Imaging', 'MedTech Inc', 'Medical imaging viewer with AI-assisted diagnostics', 'Sarah Mitchell', 'active', 'critical', '2025-03-01', '2026-02-28', ARRAY['TypeScript','React','GraphQL']),
  ('b0000000-0000-0000-0000-000000000003', 'AgileOne Portal', 'AgileOne', 'Enterprise project management portal', 'Sarah Mitchell', 'active', 'medium', '2025-02-10', '2025-09-30', ARRAY['Node.js','React','AWS']),
  ('b0000000-0000-0000-0000-000000000004', 'Design System Revamp', 'Internal', 'Company-wide design system modernization', 'Sarah Mitchell', 'planning', 'low', '2025-07-01', '2025-11-30', ARRAY['Figma','Design Systems'])
ON CONFLICT (id) DO NOTHING;

-- Seed allocations
INSERT INTO public.allocations (id, employee_id, project_id, allocation_percentage, allocation_type, mentor_id, start_date, end_date, status, notes) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 50, 'primary', NULL, '2025-01-20', '2025-12-31', 'active', 'Frontend lead'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 30, 'primary', NULL, '2025-03-05', '2026-02-28', 'active', 'Imaging viewer UI'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 20, 'primary', NULL, '2025-02-15', '2025-09-30', 'active', 'Portal components'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 60, 'primary', NULL, '2025-01-20', '2025-12-31', 'active', 'Backend services'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 40, 'primary', NULL, '2025-03-05', '2026-02-28', 'active', 'API layer'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 30, 'shadow', 'a0000000-0000-0000-0000-000000000002', '2025-02-01', '2025-06-30', 'active', 'Learning frontend patterns'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 40, 'primary', NULL, '2025-03-01', '2025-11-30', 'active', 'Design system owner'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 50, 'primary', NULL, '2025-02-20', '2025-09-30', 'active', 'QA automation')
ON CONFLICT (id) DO NOTHING;

-- Seed allocation history
INSERT INTO public.allocation_history (allocation_id, employee_id, project_id, action, allocation_percentage, allocation_type, performed_by, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'allocated', 50, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-01-20 09:00:00+00'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'allocated', 30, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-03-05 10:30:00+00'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'allocated', 20, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-02-15 14:00:00+00'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'allocated', 60, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-01-20 09:15:00+00'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'allocated', 40, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-03-05 10:45:00+00'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'allocated', 30, 'shadow', 'a0000000-0000-0000-0000-000000000001', '2025-02-01 11:00:00+00'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'allocated', 40, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-03-01 09:00:00+00'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'allocated', 50, 'primary', 'a0000000-0000-0000-0000-000000000001', '2025-02-20 13:30:00+00')
ON CONFLICT (id) DO NOTHING;
