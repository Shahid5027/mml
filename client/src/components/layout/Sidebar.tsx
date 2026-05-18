import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Calendar, 
  Users, 
  Settings, 
  FileBarChart, 
  X,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'ADMIN' | 'EMPLOYEE';
}

export const Sidebar = ({ isOpen, onClose, role = 'EMPLOYEE' }: SidebarProps) => {
  
  // Navigation lists based on Roles
  const employeeLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Geo Attendance', path: '/punch', icon: MapPin },
    { name: 'My History', path: '/history', icon: Calendar },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Staff', path: '/admin/employees', icon: Users },
    { name: 'Office Settings', path: '/admin/settings', icon: Settings },
    { name: 'Attendance Reports', path: '/admin/reports', icon: FileBarChart },
    { name: 'Security Analytics', path: '/admin/insights', icon: ShieldAlert },
  ];

  const activeLinks = role === 'ADMIN' ? adminLinks : employeeLinks;

  return (
    <>
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-all duration-300 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Banner */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Fingerprint className="h-5 w-5 animate-pulse-slow" />
            </div>
            <span className="font-sans font-bold tracking-tight text-foreground text-sm uppercase">
              GeoShield <span className="text-primary font-black">AI</span>
            </span>
          </div>
          
          {/* Close button on mobile views */}
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Link Menu */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Navigation Menu
          </p>
          {activeLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/15 shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
                  }`
                }
                onClick={onClose}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Info footer section */}
        <div className="p-4 border-t border-border bg-background/20 rounded-b-xl">
          <div className="flex items-center space-x-2 text-left rounded-lg border border-border/40 p-2.5 bg-card/50">
            <ShieldAlert className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-foreground tracking-wide uppercase">Geofencing Active</p>
              <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">Device coords tracked for check-in</p>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
};
