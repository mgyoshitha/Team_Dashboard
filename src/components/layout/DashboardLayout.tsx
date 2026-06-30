import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Layers } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';


interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ navItems, children, title }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <SidebarContent
          navItems={navItems}
          title={title}
          profile={profile}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Sidebar - mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 border-r border-gray-200 bg-white">
            <SidebarContent
              navItems={navItems}
              title={title}
              profile={profile}
              onSignOut={handleSignOut}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">{title}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  navItems: NavItem[];
  title: string;
  profile: { name: string; email: string; role: string } | null;
  onSignOut: () => void;
  onClose?: () => void;
}

function SidebarContent({ navItems, title, profile, onSignOut, onClose }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-5">
        
          <div className="flex h-15 w-15 items-center justify-center rounded-xl">
            <img src="../src/static/image.png"></img>
          </div>
       
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.endsWith('/dashboard')}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
              getAvatarColor(profile?.name || 'U')
            )}
          >
            {getInitials(profile?.name || 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{profile?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="mt-1 w-full justify-start gap-3 text-gray-600 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
