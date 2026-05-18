import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export interface DashboardLayoutProps {
  userRole?: 'ADMIN' | 'EMPLOYEE';
}

export const DashboardLayout = ({ userRole = 'EMPLOYEE' }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fallback gracefully to prop defaults if context session is loading or not seeded
  const activeUser = user || {
    name: userRole === 'ADMIN' ? 'Administrator Staff' : 'Sarah Connor',
    email: userRole === 'ADMIN' ? 'admin@geoshield.ai' : 'sarah@geoshield.ai',
    role: userRole
  };

  const getPageTitle = () => {
    const path = window.location.pathname;
    if (path.includes('punch')) return 'Check-In / Check-Out';
    if (path.includes('history')) return 'Attendance Ledger';
    if (path.includes('settings')) return 'System Settings';
    if (path.includes('employees')) return 'Staff Administration';
    if (path.includes('reports')) return 'Corporate Logs & Analytics';
    return activeUser.role === 'ADMIN' ? 'Admin Overview Console' : 'Workforce Hub Dashboard';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      
      {/* Dynamic Sidebar Container */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        role={activeUser.role}
      />

      {/* Main Content Area Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Header Navbar */}
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(true)} 
          onLogout={logout}
          title={getPageTitle()}
          user={activeUser}
        />

        {/* Dynamic Outlet / Screen Wrapper */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};
