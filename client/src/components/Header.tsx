import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { exportData } from '@/utils/exportData';
import { useToast } from '@/hooks/use-toast';

const getPageTitle = (path: string): string => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'لوحة التحكم',
    '/rabbits': 'مخزون الأرانب',
    '/breeding': 'سجلات التكاثر',
    '/health': 'الرعاية الصحية',
    '/feed': 'إدارة الأعلاف',
    '/reports': 'التقارير',
    '/users': 'إدارة المستخدمين',
    '/settings': 'الإعدادات',
  };
  
  return pathMap[path] || 'لوحة التحكم';
};

const Header: React.FC = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // Show mobile menu toggle button when Header is mounted
    const toggleButton = document.getElementById('mobile-sidebar-toggle');
    if (toggleButton) {
      toggleButton.style.display = 'block';
    }
    
    // Hide when unmounted
    return () => {
      if (toggleButton) {
        toggleButton.style.display = 'none';
      }
    };
  }, []);
  
  const handleExportData = () => {
    if (exportData()) {
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم حفظ ملف البيانات على جهازك",
        variant: "success",
      });
    } else {
      toast({
        title: "خطأ في تصدير البيانات",
        description: "حدثت مشكلة أثناء تصدير البيانات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };
  
  return (
    <header className="bg-white shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center">
        <button className="md:hidden mr-2 text-neutral-500">
          <span className="material-icons">menu</span>
        </button>
        <h2 className="text-xl font-semibold text-neutral-800">
          {getPageTitle(location)}
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative text-neutral-600 hover:text-neutral-800">
          <span className="material-icons">notifications</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800">
          <span className="material-icons">help_outline</span>
        </button>
        
        <button 
          onClick={handleExportData}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100"
        >
          <span className="material-icons text-sm">download</span>
          تصدير البيانات
        </button>
      </div>
    </header>
  );
};

export default Header;
