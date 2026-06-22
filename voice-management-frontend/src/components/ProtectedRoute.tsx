import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.roles?.some((r) => r.name?.toLowerCase() === 'admin');
  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center p-4">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have permissions to access the Admin Dashboard.</p>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return <Outlet />;
};
