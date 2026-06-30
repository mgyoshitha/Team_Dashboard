import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { useAdminData, getEmployeeAllocation } from '@/lib/hooks';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { EditEmployeeDialog } from '@/components/employees/EditEmployeeDialog';
import { DeleteEmployeeDialog } from '@/components/employees/DeleteEmployeeDialog';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';

export function EmployeesPage() {
  const { profiles, allocations, loading, refreshData } = useAdminData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Profile | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Profile | null>(null);

  const employees = useMemo(() => profiles.filter((p) => p.role === 'employee'), [profiles]);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    employees.forEach((e) => {
      if (e.primary_skill) skills.add(e.primary_skill);
      e.secondary_skills.forEach((s) => skills.add(s));
    });
    return Array.from(skills).sort();
  }, [employees]);

  const allLocations = useMemo(() => {
    const locs = new Set(employees.map((e) => e.location).filter(Boolean) as string[]);
    return Array.from(locs).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.designation || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesSkill = skillFilter === 'all' ||
        e.primary_skill === skillFilter ||
        e.secondary_skills.includes(skillFilter);
      const matchesLocation = locationFilter === 'all' || e.location === locationFilter;
      return matchesSearch && matchesStatus && matchesSkill && matchesLocation;
    });
  }, [employees, search, statusFilter, skillFilter, locationFilter]);

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description={`${employees.length} employees in your organization`}
        action={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-4 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="bench">Bench</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="shadow">Shadow</SelectItem>
              </SelectContent>
            </Select>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Skill" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {allSkills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {allLocations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Employee table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Experience</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Skills</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-muted-foreground">No employees found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  return (
                    <tr key={e.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link to={`/admin/employees/${e.id}`} className="flex items-center gap-3">
                          <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold', getAvatarColor(e.name))}>
                            {getInitials(e.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 hover:text-blue-600">{e.name}</p>
                            <p className="text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.designation || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{e.experience || 0} yrs</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {e.primary_skill && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">{e.primary_skill}</span>}
                          {e.secondary_skills.slice(0, 2).map((s) => <span key={s} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>)}
                          {e.secondary_skills.length > 2 && <span className="text-xs text-muted-foreground">+{e.secondary_skills.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
    
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/employees/${e.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditEmployee(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteEmployee(e)} className="text-rose-500 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} onSuccess={refreshData} />
      {editEmployee && <EditEmployeeDialog employee={editEmployee} open={!!editEmployee} onOpenChange={(v) => !v && setEditEmployee(null)} onSuccess={refreshData} />}
      {deleteEmployee && <DeleteEmployeeDialog employee={deleteEmployee} open={!!deleteEmployee} onOpenChange={(v) => !v && setDeleteEmployee(null)} onSuccess={refreshData} />}
    </div>
  );
}
