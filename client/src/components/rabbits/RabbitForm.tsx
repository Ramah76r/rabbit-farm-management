import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { addRabbit, updateRabbit, getRabbits } from '@/lib/data';
import { RABBIT_BREEDS, RABBIT_GENDERS, RABBIT_STATUSES, HEALTH_STATUSES } from '@/utils/constants';

interface RabbitFormProps {
  rabbitId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const rabbitFormSchema = z.object({
  tagId: z.string().min(1, { message: 'رقم التعريف مطلوب' }),
  breed: z.string().min(1, { message: 'النوع مطلوب' }),
  gender: z.string().min(1, { message: 'الجنس مطلوب' }),
  birthDate: z.date().optional(),
  acquiredDate: z.date(),
  status: z.string().min(1, { message: 'الحالة مطلوبة' }),
  weight: z.coerce.number().optional(),
  cageNumber: z.string().optional(),
  parentMaleId: z.string().optional(),
  parentFemaleId: z.string().optional(),
  notes: z.string().optional(),
  healthStatus: z.string().default('healthy'),
});

type RabbitFormValues = z.infer<typeof rabbitFormSchema>;

const RabbitForm: React.FC<RabbitFormProps> = ({
  rabbitId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isEditMode = !!rabbitId;
  
  const rabbits = getRabbits();
  const maleRabbits = rabbits.filter(rabbit => rabbit.gender === 'ذكر');
  const femaleRabbits = rabbits.filter(rabbit => rabbit.gender === 'أنثى');
  
  const rabbit = rabbits.find(r => r.id === rabbitId);
  
  const defaultValues: Partial<RabbitFormValues> = {
    tagId: '',
    breed: '',
    gender: '',
    acquiredDate: new Date(),
    status: 'نشط',
    healthStatus: 'سليم',
    ...rabbit,
    // Convert date strings to Date objects
    birthDate: rabbit?.birthDate ? new Date(rabbit.birthDate) : undefined,
    acquiredDate: rabbit?.acquiredDate ? new Date(rabbit.acquiredDate) : new Date(),
  };
  
  const form = useForm<RabbitFormValues>({
    resolver: zodResolver(rabbitFormSchema),
    defaultValues,
  });
  
  const onSubmit = (values: RabbitFormValues) => {
    try {
      if (isEditMode) {
        if (!rabbitId) return;
        
        updateRabbit(rabbitId, {
          ...values,
          createdBy: rabbit?.createdBy || user?.id || 0,
        });
        
        toast({
          title: 'تم تحديث الأرنب بنجاح',
          variant: 'success',
        });
      } else {
        // Check if tagId already exists
        const existingRabbit = rabbits.find(r => r.tagId === values.tagId);
        if (existingRabbit) {
          toast({
            title: 'خطأ',
            description: 'رقم التعريف موجود بالفعل',
            variant: 'destructive',
          });
          return;
        }
        
        addRabbit({
          ...values,
          createdBy: user?.id || 0,
        });
        
        toast({
          title: 'تمت إضافة الأرنب بنجاح',
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
            name="tagId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم التعريف *</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: R-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>النوع *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RABBIT_BREEDS.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
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
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الجنس *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RABBIT_GENDERS.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
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
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الميلاد</FormLabel>
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
                      disabled={(date) => date > new Date()}
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
            name="acquiredDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الاستحواذ *</FormLabel>
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
                      disabled={(date) => date > new Date()}
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
                    {RABBIT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
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
            name="healthStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الحالة الصحية</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة الصحية" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEALTH_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
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
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الوزن (جرام)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cageNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم القفص</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: C-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="parentMaleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأب</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأب" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">غير محدد</SelectItem>
                    {maleRabbits.map((rabbit) => (
                      <SelectItem key={rabbit.id} value={rabbit.tagId}>
                        {rabbit.tagId} - {rabbit.breed}
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
            name="parentFemaleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأم</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأم" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">غير محدد</SelectItem>
                    {femaleRabbits.map((rabbit) => (
                      <SelectItem key={rabbit.id} value={rabbit.tagId}>
                        {rabbit.tagId} - {rabbit.breed}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل أي ملاحظات إضافية هنا" {...field} />
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

export default RabbitForm;
