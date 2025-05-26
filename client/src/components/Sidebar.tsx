import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import { logoSvg } from '@/assets/images';

const Sidebar: React.FC = () => {
  const { user, logout, isAdmin, isManager } = useAuthContext();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };
  
  const navItems = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
    { path: '/rabbits', label: 'مخزون الأرانب', icon: 'inventory_2' },
    { path: '/breeding', label: 'سجلات التكاثر', icon: 'favorite' },
    { path: '/health', label: 'الرعاية الصحية', icon: 'medical_services' },
    { path: '/feed', label: 'إدارة الأعلاف', icon: 'restaurant' },
    { path: '/reports', label: 'التقارير', icon: 'analytics' },
    // User management is only for admins and managers
    ...(isManager ? [{ path: '/users', label: 'إدارة المستخدمين', icon: 'group' }] : []),
    { path: '/settings', label: 'الإعدادات', icon: 'settings' },
  ];
  
  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeMobileSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 right-0 w-64 bg-white shadow-md z-30 transform transition-transform duration-300 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        } md:static md:z-10`}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 flex items-center">
            <span className="mr-2" dangerouslySetInnerHTML={{ __html: logoSvg }}></span>
            إدارة مزرعة الأرانب
          </h1>
          <button className="md:hidden text-neutral-500" onClick={closeMobileSidebar}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
              <span className="material-icons">person</span>
            </div>
            <div>
              <p className="font-medium">{user?.fullName || "مستخدم"}</p>
              <p className="text-sm text-neutral-500">
                {user?.role === 'admin' && "مدير النظام"}
                {user?.role === 'manager' && "مدير المزرعة"}
                {user?.role === 'worker' && "عامل"}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  onClick={closeMobileSidebar}
                  className={`flex items-center p-2 rounded-md ${
                    location === item.path 
                      ? 'text-white bg-primary-600' 
                      : 'hover:bg-neutral-100'
                  }`}
                >
                  <span className="material-icons ml-2">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <button 
            onClick={logout}
            className="flex items-center p-2 text-neutral-600 hover:bg-neutral-100 rounded-md w-full"
          >
            <span className="material-icons ml-2">logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>
      
      {/* Mobile toggle button (rendered in Header.tsx) */}
      <button
        className="fixed top-4 right-4 z-10 md:hidden bg-white p-2 rounded-md shadow-md text-neutral-500"
        onClick={() => setIsMobileOpen(true)}
        id="mobile-sidebar-toggle"
        style={{ display: 'none' }} // This is controlled by Header.tsx
      >
        <span className="material-icons">menu</span>
      </button>
    </>
  );
};

export default Sidebar;
