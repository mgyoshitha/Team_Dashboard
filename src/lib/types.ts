export type UserRole = 'admin' | 'employee';
export type EmployeeStatus = 'bench' | 'allocated' | 'shadow';
export type ProjectStatus = 'backlog' | 'todo' | 'in_progress' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectType = 'project' | 'accelerator' | 'poc';
export type AllocationType = 'primary' | 'shadow';
export type AllocationStatus = 'active' | 'completed' | 'released' | 'on_hold';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  designation: string | null;
  experience: number | null;
  primary_skill: string | null;
  secondary_skills: string[];
  location: string | null;
  phone: string | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  description: string | null;
  project_manager: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  project_type: ProjectType;
  start_date: string | null;
  end_date: string | null;
  required_skills: string[];
  created_at: string;
}

export interface Allocation {
  id: string;
  employee_id: string;
  project_id: string;
  allocation_percentage: number;
  allocation_type: AllocationType;
  mentor_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AllocationStatus;
  notes: string | null;
  created_at: string;
  // joined fields
  employee?: Profile;
  project?: Project;
  mentor?: Profile;
}

export interface AllocationHistory {
  id: string;
  allocation_id: string | null;
  employee_id: string | null;
  project_id: string | null;
  action: string;
  allocation_percentage: number | null;
  allocation_type: AllocationType | null;
  performed_by: string | null;
  created_at: string;
  // joined fields
  employee?: Profile;
  project?: Project;
  performer?: Profile;
}
