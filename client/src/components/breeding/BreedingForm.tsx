import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
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
import { addBreedingRecord, updateBreedingRecord, getRabbits, getBreedingRecordById } from '@/lib/data';
import { BREEDING_STATUSES } from '@/utils/constants';

interface BreedingFormProps {
  breedingId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const breedingFormSchema = z.object({
  maleId: z.string().min(1, { message: 'رقم الذكر مطلوب' }),
  femaleId: z.string().min(1, { message: 'رقم الأنثى مطلوب' }),
  matingDate: z.date(),
  expectedBirthDate: z.date().optional(),
  actualBirthDate: z.date().optional(),
  status: z.string().min(1, { message: 'الحالة مطلوبة' }),
  litterSize: z.coerce.number().optional(),
  litterAlive: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type BreedingFormValues = z.infer<typeof breedingFormSchema>;

const BreedingForm: React.FC<BreedingFormProps> = ({
  breedingId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isEditMode = !!breedingId;
  
  const rabbits = getRabbits();
  const maleRabbits = rabbits.filter(rabbit => rabbit.gender === 'ذكر' && rabbit.status === 'نشط');
  const femaleRabbits = rabbits.filter(rabbit => rabbit.gender === 'أنثى' && (rabbit.status === 'نشط' || rabbit.status === 'حامل'));
  
  const breedingRecord = breedingId ? getBreedingRecordById(breedingId) : undefined;
  
  const defaultValues: Partial<BreedingFormValues> = {
    maleId: '',
    femaleId: '',
    matingDate: new Date(),
    status: 'في انتظار الولادة',
    ...breedingRecord,
    // Convert date strings to Date objects
    matingDate: breedingRecord?.matingDate ? new Date(breedingRecord.matingDate) : new Date(),
    expectedBirthDate: breedingRecord?.expectedBirthDate ? new Date(breedingRecord.expectedBirthDate) : undefined,
    actualBirthDate: breedingRecord?.actualBirthDate ? new Date(breedingRecord.actualBirthDate) : undefined,
  };
  
  const form = useForm<BreedingFormValues>({
    resolver: zodResolver(breedingFormSchema),
    defaultValues,
  });
  
  // Watch matingDate to auto-calculate expectedBirthDate
  const matingDate = form.watch('matingDate');
  const status = form.watch('status');
  
  React.useEffect(() => {
    if (matingDate) {
      // Rabbit gestation is around 30-31 days
      const expectedDate = addDays(matingDate, 31);
      form.setValue('expectedBirthDate', expectedDate);
    }
  }, [matingDate, form]);
  
  const onSubmit = (values: BreedingFormValues) => {
    try {
      // Validate that male and female are different
      if (values.maleId === values.femaleId) {
        toast({
          title: 'خطأ',
          description: 'يجب اختيار ذكر وأنثى مختلفين',
          variant: 'destructive',
        });
        return;
      }
      
      if (isEditMode) {
        if (!breedingId) return;
        
        updateBreedingRecord(breedingId, {
          ...values,
          createdBy: breedingRecord?.createdBy || user?.id || 0,
        });
        
        toast({
          title: 'تم تحديث سجل التكاثر بنجاح',
          variant: 'success',
        });
      } else {
        addBreedingRecord({
          ...values,
          createdBy: user?.id || 0,
        });
        
        toast({
          title: 'تمت إضافة سجل التكاثر بنجاح',
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
            name="maleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الذكر *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الذكر" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
            name="femaleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأنثى *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأنثى" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
          
          <FormField
            control={form.control}
            name="matingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ التزاوج *</FormLabel>
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
            name="expectedBirthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الولادة المتوقع</FormLabel>
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
                    {BREEDING_STATUSES.map((status) => (
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
          
          {(status === 'ولادة ناجحة' || status === 'فشل') && (
            <FormField
              control={form.control}
              name="actualBirthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاريخ الولادة الفعلي</FormLabel>
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
          )}
          
          {status === 'ولادة ناجحة' && (
            <>
              <FormField
                control={form.control}
                name="litterSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الصغار الكلي</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="litterAlive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الصغار على قيد الحياة</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
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

export default BreedingForm;
