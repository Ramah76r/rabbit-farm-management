import React from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  const [location] = useLocation();
  
  // If loading, show a simple loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin w-10 h-10 border-t-2 border-primary-600 rounded-full"></div>
      </div>
    );
  }
  
  // If not authenticated and not on login page, the AuthProtection component will handle redirection
  if (!isAuthenticated && location !== '/login') {
    return <>{children}</>;
  }
  
  // If on login page, render without layout
  if (location === '/login') {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 flex flex-col bg-neutral-50">
        <Header />
        <div className="p-6 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
