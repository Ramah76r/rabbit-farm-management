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
import { addFeedConsumption, getFeedInventory } from '@/lib/data';

interface FeedConsumptionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const feedConsumptionFormSchema = z.object({
  feedId: z.coerce.number().min(1, { message: 'نوع العلف مطلوب' }),
  quantity: z.coerce.number().min(1, { message: 'الكمية مطلوبة ويجب أن تكون أكبر من صفر' }),
  consumptionDate: z.date(),
  groupId: z.string().optional(),
  notes: z.string().optional(),
});

type FeedConsumptionFormValues = z.infer<typeof feedConsumptionFormSchema>;

const FeedConsumptionForm: React.FC<FeedConsumptionFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const feedInventory = getFeedInventory();
  
  const defaultValues: Partial<FeedConsumptionFormValues> = {
    consumptionDate: new Date(),
  };
  
  const form = useForm<FeedConsumptionFormValues>({
    resolver: zodResolver(feedConsumptionFormSchema),
    defaultValues,
  });
  
  const selectedFeedId = form.watch('feedId');
  const selectedFeed = feedInventory.find(feed => feed.id === selectedFeedId);
  
  const onSubmit = (values: FeedConsumptionFormValues) => {
    try {
      // Check if selected quantity is available
      if (selectedFeed && values.quantity > selectedFeed.quantity) {
        toast({
          title: 'خطأ',
          description: `الكمية المتاحة من العلف المحدد هي ${selectedFeed.quantity} جرام فقط`,
          variant: 'destructive',
        });
        return;
      }
      
      addFeedConsumption({
        ...values,
        createdBy: user?.id || 0,
      });
      
      // Update inventory quantity
      if (selectedFeed) {
        const updatedQuantity = selectedFeed.quantity - values.quantity;
        // This update will be handled by the server-side logic
      }
      
      toast({
        title: 'تمت إضافة سجل استهلاك العلف بنجاح',
        variant: 'success',
      });
      
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
            name="feedId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نوع العلف *</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العلف" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feedInventory.map((feed) => (
                      <SelectItem key={feed.id} value={feed.id.toString()}>
                        {feed.feedType} - متاح: {feed.quantity} جرام
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
                  <Input type="number" min="1" max={selectedFeed?.quantity} {...field} />
                </FormControl>
                {selectedFeed && (
                  <p className="text-xs text-muted-foreground">
                    المتاح: {selectedFeed.quantity} جرام
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="consumptionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الاستهلاك *</FormLabel>
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
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>مجموعة/قفص</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: C-10" {...field} value={field.value || ''} />
                </FormControl>
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
            إضافة
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FeedConsumptionForm;
