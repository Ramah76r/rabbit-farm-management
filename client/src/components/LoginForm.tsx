import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { initializeDefaultData } from '@/lib/data';

const loginSchema = z.object({
  username: z.string().min(1, { message: 'اسم المستخدم مطلوب' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });
  
  React.useEffect(() => {
    // Initialize default admin user if no users exist
    initializeDefaultData();
  }, []);
  
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const success = await login(values.username, values.password);
      
      if (success) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك في نظام إدارة مزرعة الأرانب',
          variant: 'success',
        });
      } else {
        toast({
          title: 'فشل تسجيل الدخول',
          description: 'اسم المستخدم أو كلمة المرور غير صحيحة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'حدث خطأ',
        description: 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المستخدم</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسم المستخدم" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور</FormLabel>
              <FormControl>
                <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="rememberMe"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  تذكرني
                </label>
              </div>
            )}
          />
          
          <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            نسيت كلمة المرور؟
          </a>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white"></span>
              جاري تسجيل الدخول...
            </span>
          ) : (
            'تسجيل الدخول'
          )}
        </Button>
        
        <div className="text-center text-sm text-gray-500">
          <p>بيانات الدخول الافتراضية:</p>
          <p>اسم المستخدم: admin</p>
          <p>كلمة المرور: admin123</p>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
