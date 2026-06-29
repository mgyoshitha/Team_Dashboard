import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/Badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Briefcase, Award, Clock } from 'lucide-react';
import { getInitials, getAvatarColor, cn } from '@/lib/utils';

export function MyProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return <div className="text-center text-muted-foreground">Profile not found</div>;
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Your personal and professional information" />

      <Card className="mb-6 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold', getAvatarColor(profile.name))}>
              {getInitials(profile.name)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">{profile.designation || '—'}</p>
            </div>
            <StatusBadge status={profile.status} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={profile.location} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Designation" value={profile.designation} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Experience" value={`${profile.experience || 0} years`} />
            <InfoRow icon={<Award className="h-4 w-4" />} label="Role" value={profile.role} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.primary_skill && <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700">{profile.primary_skill}</span>}
              {profile.secondary_skills.map((s) => <span key={s} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600">{s}</span>)}
              {!profile.primary_skill && profile.secondary_skills.length === 0 && <span className="text-sm text-muted-foreground">No skills listed</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-medium text-gray-900 capitalize">{value || '—'}</span>
    </div>
  );
}
