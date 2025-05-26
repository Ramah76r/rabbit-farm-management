import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addUser, updateUser, getUserById, getRabbits } from '@/lib/data';
import { USER_ROLES, USER_ROLE_LABELS } from '@/utils/constants';

interface UserFormProps {
  userId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const userFormSchema = z.object({
  username: z.string().min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }).optional(),
  fullName: z.string().min(2, { message: 'الاسم الكامل مطلوب' }),
  role: z.string().min(1, { message: 'الدور مطلوب' }),
  isActive: z.boolean().default(true),
  assignedRabbits: z.array(z.string()).default([]),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const UserForm: React.FC<UserFormProps> = ({
  userId,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const isEditMode = !!userId;
  
  const user = userId ? getUserById(userId) : undefined;
  const rabbits = getRabbits();
  
  // When editing, make password optional
  const schema = isEditMode
    ? userFormSchema
    : userFormSchema.extend({
        password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
      });
  
  const defaultValues: Partial<UserFormValues> = {
    username: '',
    password: '',
    fullName: '',
    role: 'worker',
    isActive: true,
    assignedRabbits: [],
    ...user,
    // Convert assignedRabbits to string array if needed
    assignedRabbits: user?.assignedRabbits as string[] || [],
  };
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  
  // Get the current role to conditionally render the assigned rabbits field
  const currentRole = form.watch('role');
  const showAssignedRabbits = currentRole === 'worker';
  
  const onSubmit = (values: UserFormValues) => {
    try {
      if (isEditMode) {
        if (!userId) return;
        
        // If password is empty, remove it from the update
        const updateData = { ...values };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        updateUser(userId, updateData);
        
        toast({
          title: 'تم تحديث المستخدم بنجاح',
          variant: 'success',
        });
      } else {
        // Check if password is provided for new users
        if (!values.password) {
          toast({
            title: 'خطأ',
            description: 'كلمة المرور مطلوبة للمستخدمين الجدد',
            variant: 'destructive',
          });
          return;
        }
        
        addUser(values);
        
        toast({
          title: 'تمت إضافة المستخدم بنجاح',
          variant: 'success',
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المستخدم *</FormLabel>
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
                <FormLabel>{isEditMode ? 'كلمة المرور (اتركها فارغة للإبقاء عليها)' : 'كلمة المرور *'}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="أدخل كلمة المرور" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاسم الكامل *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل الاسم الكامل" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الدور *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {USER_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">حالة المستخدم</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value ? 'نشط' : 'غير نشط'}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {showAssignedRabbits && (
          <FormField
            control={form.control}
            name="assignedRabbits"
            render={() => (
              <FormItem>
                <FormLabel>الأرانب المخصصة</FormLabel>
                <div className="mt-2 space-y-2">
                  {rabbits.map((rabbit) => (
                    <div key={rabbit.id} className="flex items-center">
                      <FormField
                        control={form.control}
                        name="assignedRabbits"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(rabbit.tagId)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, rabbit.tagId]);
                                  } else {
                                    field.onChange(currentValues.filter(value => value !== rabbit.tagId));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {rabbit.tagId} - {rabbit.breed}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit">
            {isEditMode ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Import the Checkbox component that was missing in the implementation
import { Checkbox } from '@/components/ui/checkbox';

export default UserForm;
