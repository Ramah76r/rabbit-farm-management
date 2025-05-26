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
import { addFeedInventory, updateFeedInventory, getFeedInventoryById } from '@/lib/data';
import { FEED_TYPES } from '@/utils/constants';

interface FeedInventoryFormProps {
  feedId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const feedInventoryFormSchema = z.object({
  feedType: z.string().min(1, { message: 'نوع العلف مطلوب' }),
  quantity: z.coerce.number().min(1, { message: 'الكمية مطلوبة ويجب أن تكون أكبر من صفر' }),
  acquired: z.date(),
  expirationDate: z.date().optional(),
  supplierInfo: z.string().optional(),
  cost: z.coerce.number().optional(),
});

type FeedInventoryFormValues = z.infer<typeof feedInventoryFormSchema>;

const FeedInventoryForm: React.FC<FeedInventoryFormProps> = ({
  feedId,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isEditMode = !!feedId;
  
  const feedItem = feedId ? getFeedInventoryById(feedId) : undefined;
  
  const defaultValues: Partial<FeedInventoryFormValues> = {
    feedType: '',
    quantity: 0,
    acquired: new Date(),
    ...feedItem,
    // Convert date strings to Date objects
    acquired: feedItem?.acquired ? new Date(feedItem.acquired) : new Date(),
    expirationDate: feedItem?.expirationDate ? new Date(feedItem.expirationDate) : undefined,
  };
  
  const form = useForm<FeedInventoryFormValues>({
    resolver: zodResolver(feedInventoryFormSchema),
    defaultValues,
  });
  
  const onSubmit = (values: FeedInventoryFormValues) => {
    try {
      if (isEditMode) {
        if (!feedId) return;
        
        updateFeedInventory(feedId, {
          ...values,
          createdBy: feedItem?.createdBy || user?.id || 0,
        });
        
        toast({
          title: 'تم تحديث العلف بنجاح',
          variant: 'success',
        });
      } else {
        addFeedInventory({
          ...values,
          createdBy: user?.id || 0,
        });
        
        toast({
          title: 'تمت إضافة العلف بنجاح',
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
            name="feedType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع العلف *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العلف" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FEED_TYPES.map((type) => (
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
          
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية (جرام) *</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="acquired"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الاستلام *</FormLabel>
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
            name="expirationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
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
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>التكلفة</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="supplierInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>معلومات المورد</FormLabel>
              <FormControl>
                <Textarea placeholder="أدخل معلومات المورد هنا" {...field} value={field.value || ''} />
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

export default FeedInventoryForm;
