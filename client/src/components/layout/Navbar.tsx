import React, { useState } from 'react';
import { Menu, User, LogOut, Settings, Shield, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface NavbarProps {
  onToggleSidebar: () => void;
  onLogout?: () => void;
  title?: string;
  user?: {
    name: string;
    email: string;
    role: 'ADMIN' | 'EMPLOYEE';
  };
}

export const Navbar = ({ 
  onToggleSidebar, 
  onLogout,
  title = 'GeoShield AI', 
  user = { name: 'Demo User', email: 'user@geoshield.ai', role: 'EMPLOYEE' } 
}: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Left Section: Menu Toggle & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-all focus:outline-none lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-base font-semibold font-sans tracking-tight text-foreground sm:text-lg">
              {title}
            </h1>
          </div>
        </div>

        {/* Right Section: DateTime & Profile Menu */}
        <div className="flex items-center space-x-4">
          
          {/* DateTime Display (Visible on SM and up) */}
          <div className="hidden items-center space-x-2 text-xs text-muted-foreground sm:flex bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{today}</span>
          </div>

          {/* User Badge */}
          <Badge variant={user.role === 'ADMIN' ? 'primary' : 'secondary'} className="text-[10px] py-0.5 px-2">
            {user.role === 'ADMIN' ? <Shield className="h-3 w-3 mr-1 inline" /> : null}
            {user.role}
          </Badge>

          {/* User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 transition-all focus:outline-none"
            >
              <User className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop handler */}
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                
                {/* Dropdown Card */}
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-border bg-card p-1 shadow-premium-hover ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-fade-in">
                  
                  {/* Account Header */}
                  <div className="px-3 py-2 border-b border-border text-left">
                    <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); }}
                      className="flex w-full items-center px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <Settings className="mr-2 h-3.5 w-3.5" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); onLogout?.(); }}
                      className="flex w-full items-center px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
