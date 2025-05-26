import React from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import { logoSvg } from '@/assets/images';

const Login: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const [, setLocation] = useLocation();
  
  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);
  
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div style={{ width: '80px', height: '80px' }} dangerouslySetInnerHTML={{ __html: logoSvg }}></div>
          </div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            مرحباً بك في نظام إدارة مزرعة الأرانب
          </h2>
          <p className="text-neutral-500">الرجاء تسجيل الدخول للمتابعة</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
