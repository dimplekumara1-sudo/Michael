import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    user: !!user, 
    profile: !!profile, 
    isLoading, 
    isAdmin, 
    requireAdmin,
    userEmail: user?.email 
  });

  // Show loading spinner while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For admin-only routes, check admin status
  if (requireAdmin) {
    // If profile is not loaded yet, show loading
    if (!profile) {
      console.log('Admin route: Profile not loaded yet, showing loading...');
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
            <p className="mt-2 text-sm text-gray-500">Verifying admin access</p>
          </div>
        </div>
      );
    }
    
    // Check if user is admin
    if (!isAdmin) {
      console.log('Admin access required but user is not admin, redirecting to user dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('All checks passed, rendering protected content');
  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;