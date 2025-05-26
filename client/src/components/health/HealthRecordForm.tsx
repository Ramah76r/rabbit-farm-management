import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { addHealthRecord, updateHealthRecord, getRabbits, getHealthRecordById } from '@/lib/data';
import { HEALTH_RECORD_TYPES } from '@/utils/constants';

interface HealthRecordFormProps {
  healthRecordId?: number;
  rabbitId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const healthRecordFormSchema = z.object({
  rabbitId: z.string().min(1, { message: 'رقم الأرنب مطلوب' }),
  recordDate: z.date(),
  recordType: z.string().min(1, { message: 'نوع السجل مطلوب' }),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({
  healthRecordId,
  rabbitId: initialRabbitId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isEditMode = !!healthRecordId;
  
  const rabbits = getRabbits();
  const healthRecord = healthRecordId ? getHealthRecordById(healthRecordId) : undefined;
  
  const defaultValues: Partial<HealthRecordFormValues> = {
    rabbitId: initialRabbitId || '',
    recordDate: new Date(),
    recordType: '',
    ...healthRecord,
    // Convert date strings to Date objects
    recordDate: healthRecord?.recordDate ? new Date(healthRecord.recordDate) : new Date(),
  };
  
  const form = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues,
  });
  
  const onSubmit = (values: HealthRecordFormValues) => {
    try {
      if (isEditMode) {
        if (!healthRecordId) return;
        
        updateHealthRecord(healthRecordId, {
          ...values,
          createdBy: healthRecord?.createdBy || user?.id || 0,
        });
        
        toast({
          title: 'تم تحديث السجل الصحي بنجاح',
          variant: 'success',
        });
      } else {
        addHealthRecord({
          ...values,
          createdBy: user?.id || 0,
        });
        
        toast({
          title: 'تمت إضافة السجل الصحي بنجاح',
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
            name="rabbitId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الأرنب *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!initialRabbitId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأرنب" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rabbits.map((rabbit) => (
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
            name="recordDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ السجل *</FormLabel>
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
            name="recordType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع السجل *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع السجل" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEALTH_RECORD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
          name="diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التشخيص</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل التشخيص هنا" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="treatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العلاج</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل تفاصيل العلاج هنا" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ملاحظات</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل أي ملاحظات إضافية هنا" {...field} value={field.value || ''} />
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

export default HealthRecordForm;
