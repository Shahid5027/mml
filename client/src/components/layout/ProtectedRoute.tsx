import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Fingerprint } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: ('ADMIN' | 'EMPLOYEE')[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // 1. Sleek loading placeholder during state evaluation
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 animate-pulse">
          <Fingerprint className="h-6 w-6 animate-bounce" />
        </div>
        <p className="text-xs text-muted-foreground font-medium animate-pulse-slow">
          Validating authorization key...
        </p>
      </div>
    );
  }

  // 2. Redirect to Login if unauthenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Redirect to home dashboard if active role has mismatch permissions
  if (!allowedRoles.includes(user.role)) {
    console.warn(`Unauthorized route attempt by role ${user.role}. Bouncing to dashboard...`);
    const fallbackPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  // 4. Render children views
  return <Outlet />;
};
