import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { addTask, updateTask, getTaskById, getUsers } from '@/lib/data';
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/utils/constants';

interface TaskFormProps {
  taskId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const taskFormSchema = z.object({
  title: z.string().min(1, { message: 'العنوان مطلوب' }),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.string().min(1, { message: 'الحالة مطلوبة' }),
  assignedTo: z.coerce.number().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskForm: React.FC<TaskFormProps> = ({
  taskId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isEditMode = !!taskId;
  
  const task = taskId ? getTaskById(taskId) : undefined;
  const users = getUsers();
  
  const defaultValues: Partial<TaskFormValues> = {
    title: '',
    status: 'pending',
    ...task,
    // Convert date strings to Date objects
    dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
  };
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });
  
  const onSubmit = (values: TaskFormValues) => {
    try {
      if (isEditMode) {
        if (!taskId) return;
        
        updateTask(taskId, values);
        
        toast({
          title: 'تم تحديث المهمة بنجاح',
          variant: 'success',
        });
      } else {
        addTask({
          ...values,
          createdBy: user?.id || 0,
        });
        
        toast({
          title: 'تمت إضافة المهمة بنجاح',
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
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عنوان المهمة *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل عنوان المهمة" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الاستحقاق</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={`pl-3 text-left font-normal ${!field.value ? 'text-muted-foreground' : ''}`}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ar })
                        ) : (
                          <span>اختر تاريخ</span>
                        )}
                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TASK_STATUS_LABELS[status]}
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
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تعيين إلى</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستخدم" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">غير معين</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف المهمة</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل وصف المهمة هنا" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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

export default TaskForm;
