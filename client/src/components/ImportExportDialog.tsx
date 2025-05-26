import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { exportData } from '@/utils/exportData';
import { importData, mergeData } from '@/utils/importData';
import { useToast } from '@/hooks/use-toast';

interface ImportExportDialogProps {
  trigger: React.ReactNode;
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ trigger }) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleExport = () => {
    if (exportData()) {
      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم حفظ ملف البيانات على جهازك",
        variant: "success",
      });
      setIsOpen(false);
    } else {
      toast({
        title: "خطأ في تصدير البيانات",
        description: "حدثت مشكلة أثناء تصدير البيانات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleImport = async (merge: boolean = false) => {
    if (!selectedFile) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف لاستيراده",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (merge) {
        await mergeData(selectedFile);
        toast({
          title: "تم دمج البيانات بنجاح",
          description: "تم دمج البيانات مع البيانات الحالية",
          variant: "success",
        });
      } else {
        await importData(selectedFile);
        toast({
          title: "تم استيراد البيانات بنجاح",
          description: "تم استبدال البيانات الحالية بالبيانات المستوردة",
          variant: "success",
        });
      }
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "خطأ في استيراد البيانات",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>استيراد وتصدير البيانات</DialogTitle>
          <DialogDescription>
            يمكنك استيراد أو تصدير بيانات المزرعة للنسخ الاحتياطي أو النقل بين الأجهزة
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="export">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
            <TabsTrigger value="import">استيراد البيانات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="py-4">
            <p className="mb-4 text-sm text-neutral-600">
              سيتم تصدير جميع بيانات المزرعة إلى ملف JSON يمكنك حفظه على جهازك.
            </p>
            <Button onClick={handleExport}>
              <span className="material-icons ml-2 text-sm">download</span>
              تصدير البيانات
            </Button>
          </TabsContent>
          
          <TabsContent value="import" className="py-4">
            <div className="mb-4">
              <Label htmlFor="file-upload" className="block mb-2">اختر ملف البيانات:</Label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-neutral-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button onClick={() => handleImport(false)}>
                <span className="material-icons ml-2 text-sm">upload</span>
                استيراد (استبدال)
              </Button>
              <Button variant="outline" onClick={() => handleImport(true)}>
                <span className="material-icons ml-2 text-sm">merge_type</span>
                استيراد (دمج)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportDialog;
