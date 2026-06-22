import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Users, ShieldAlert } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/users', label: 'Users DB Sheet', icon: Users },
    { to: '/dashboard/roles', label: 'Roles DB Sheet', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold tracking-tight text-primary">VoiceAdmin</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
      <div className="border-t border-border p-4 space-y-4">
        <div className="flex flex-col gap-0.5 px-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Info</span>
          <span className="text-sm font-medium truncate" title={user?.email}>
            {user?.email}
          </span>
          <span className="text-xs text-muted-foreground uppercase">
            {user?.roles?.map((r) => r.name).join(', ') || 'user'}
          </span>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
