import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#080B11] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-xs tracking-wider uppercase font-black font-mono">Syncing Secure Session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
