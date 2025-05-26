import React from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';

interface AuthProtectionProps {
  children: React.ReactNode;
  roles?: string[];
}

const AuthProtection: React.FC<AuthProtectionProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuthContext();
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, loading, setLocation]);
  
  React.useEffect(() => {
    if (!loading && isAuthenticated && roles && user) {
      // Check if user has required role
      if (!roles.includes(user.role)) {
        setLocation('/dashboard');
      }
    }
  }, [isAuthenticated, loading, roles, user, setLocation]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin w-10 h-10 border-t-2 border-primary-600 rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return null;
  }
  
  return <>{children}</>;
};

export default AuthProtection;
