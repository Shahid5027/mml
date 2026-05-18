import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './pages/login/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { PunchActionPage } from './pages/employee/PunchActionPage';
import { AttendanceHistory } from './pages/employee/AttendanceHistory';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EmployeeManagement } from './pages/admin/EmployeeManagement';
import { OfficeSettings } from './pages/admin/OfficeSettings';
import { AdminReports } from './pages/admin/AdminReports';
import { AttendanceInsights } from './pages/admin/AttendanceInsights';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Employee-Only Route Gates */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']} />}>
            <Route element={<DashboardLayout userRole="EMPLOYEE" />}>
              <Route path="/dashboard" element={<EmployeeDashboard />} />
              <Route path="/punch" element={<PunchActionPage />} />
              <Route path="/history" element={<AttendanceHistory />} />
            </Route>
          </Route>

          {/* Admin-Only Route Gates */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<DashboardLayout userRole="ADMIN" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<EmployeeManagement />} />
              <Route path="/admin/settings" element={<OfficeSettings />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/insights" element={<AttendanceInsights />} />
            </Route>
          </Route>

          {/* Default fallback catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}
