import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'framer-motion';
import { Compass, Activity, Settings, Users, FileSpreadsheet, LogOut, ShieldCheck } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar collapse state backed by localStorage so it persists instantly across page changes
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('geoshield_admin_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('geoshield_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Determine active tab/route
  const getActiveTab = () => {
    if (location.pathname === '/admin/reports') return 'reports';
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'roster';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    if (tab === 'reports') {
      navigate('/admin/reports');
    } else {
      navigate(`/admin?tab=${tab}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex font-sans overflow-x-hidden">
      {/* BACKGROUND PREMIUM GLOW LAYER */}
      <div className="glow-spot w-[600px] h-[600px] -top-60 -right-60 animate-pulse" />
      <div className="glow-spot w-[500px] h-[500px] bottom-10 left-10 opacity-30" />

      {/* 1. COLLAPSIBLE SIDEBAR */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? '72px' : '260px' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col shrink-0 bg-[#18181b] border-r border-white/[0.08] sticky top-0 h-screen z-20 overflow-hidden"
      >
        {/* Brand Banner */}
        <div className="p-6 flex items-center justify-between border-b border-white/[0.04]">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              <span className="font-bold tracking-tight text-lg">GeoShield AI</span>
            </motion.div>
          )}
          {isSidebarCollapsed && <ShieldCheck className="w-6 h-6 text-blue-500 mx-auto" />}
        </div>

        {/* Navigation Registry Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => handleTabChange('roster')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-premium cursor-pointer border-0 ${
              activeTab === 'roster'
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Today's Roster</span>}
          </button>
          
          <button
            onClick={() => handleTabChange('insights')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-premium cursor-pointer border-0 ${
              activeTab === 'insights'
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Workforce Insights</span>}
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-premium cursor-pointer border-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Geofence Settings</span>}
          </button>

          <button
            onClick={() => handleTabChange('employees')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-premium cursor-pointer border-0 ${
              activeTab === 'employees'
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {!isSidebarCollapsed && <span>Employee Directory</span>}
          </button>

          <button
            onClick={() => handleTabChange('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-premium cursor-pointer border-0 ${
              activeTab === 'reports'
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {!isSidebarCollapsed && <span>CSV Reports</span>}
          </button>
        </nav>

        {/* Sidebar Footer and collapse toggle */}
        <div className="p-4 border-t border-white/[0.04] space-y-4">
          <button
            onClick={handleToggleSidebar}
            className="hidden md:block w-full text-center text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-0 py-1"
          >
            {isSidebarCollapsed ? '➡️' : '◀️ Collapse'}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-white/[0.06] hover:bg-zinc-800 text-xs font-bold text-zinc-300 rounded-xl transition-premium cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* 2. MAIN HUB WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#18181b]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-around px-2 z-30 shadow-premium">
        <button
          onClick={() => handleTabChange('roster')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer border-0 bg-transparent text-[9px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'roster' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Roster</span>
        </button>

        <button
          onClick={() => handleTabChange('insights')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer border-0 bg-transparent text-[9px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'insights' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>Insights</span>
        </button>

        <button
          onClick={() => handleTabChange('reports')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer border-0 bg-transparent text-[9px] font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'reports' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Reports</span>
        </button>

        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 cursor-pointer border-0 bg-transparent text-[9px] font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );
};

export default AdminLayout;
