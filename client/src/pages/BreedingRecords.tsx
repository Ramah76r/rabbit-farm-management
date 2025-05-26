import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import BreedingForm from '@/components/breeding/BreedingForm';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getBreedingRecords, getBreedingRecordById, updateBreedingRecord, getRabbitByTagId, updateRabbit } from '@/lib/data';
import { BreedingRecord } from '@shared/schema';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const BreedingRecords: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadRecords();
  }, [refreshKey, user]);
  
  const loadRecords = () => {
    let allRecords = getBreedingRecords();
    
    // For worker, filter only assigned rabbits
    if (user?.role === 'worker' && user.assignedRabbits) {
      const assignedRabbits = user.assignedRabbits as string[];
      allRecords = allRecords.filter(record => 
        assignedRabbits.includes(record.maleId) || assignedRabbits.includes(record.femaleId)
      );
    }
    
    // Sort by mating date, newest first
    allRecords.sort((a, b) => 
      new Date(b.matingDate).getTime() - new Date(a.matingDate).getTime()
    );
    
    setRecords(allRecords);
  };
  
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsFormDialogOpen(true);
  };
  
  const handleEditRecord = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setIsFormDialogOpen(true);
  };
  
  const handleViewRecord = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };
  
  const handleRecordResult = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setIsResultDialogOpen(true);
  };
  
  const confirmResult = async (result: 'success' | 'failed', litterSize?: number, litterAlive?: number) => {
    if (!selectedRecord) return;
    
    try {
      // Update breeding record
      const updatedRecord = await updateBreedingRecord(selectedRecord.id, {
        status: result === 'success' ? 'ولادة ناجحة' : 'فشل',
        actualBirthDate: new Date(),
        litterSize: result === 'success' ? litterSize : 0,
        litterAlive: result === 'success' ? litterAlive : 0,
      });
      
      // If successful, update female rabbit status
      if (result === 'success') {
        const femaleRabbit = getRabbitByTagId(selectedRecord.femaleId);
        if (femaleRabbit) {
          updateRabbit(femaleRabbit.id, {
            status: 'نشط', // Change from pregnant to active
          });
        }
      }
      
      toast({
        title: 'تم تحديث سجل التكاثر',
        description: result === 'success' 
          ? `تم تسجيل ولادة ناجحة مع ${litterSize} صغير`
          : 'تم تسجيل فشل عملية التكاثر',
        variant: 'success',
      });
      
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث سجل التكاثر',
        variant: 'destructive',
      });
    }
  };
  
  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Filter records based on active tab
  const filteredRecords = activeTab === 'all' 
    ? records 
    : records.filter(record => 
        activeTab === 'pending' 
          ? record.status === 'في انتظار الولادة' 
          : activeTab === 'success' 
            ? record.status === 'ولادة ناجحة'
            : record.status === 'فشل'
      );
  
  // Count records by status
  const statusCounts = {
    all: records.length,
    pending: records.filter(record => record.status === 'في انتظار الولادة').length,
    success: records.filter(record => record.status === 'ولادة ناجحة').length,
    failed: records.filter(record => record.status === 'فشل').length,
  };
  
  // Table columns
  const columns = [
    {
      header: 'رقم الذكر',
      accessor: 'maleId',
    },
    {
      header: 'رقم الأنثى',
      accessor: 'femaleId',
    },
    {
      header: 'تاريخ التزاوج',
      accessor: (record: BreedingRecord) => format(new Date(record.matingDate), 'yyyy/MM/dd', { locale: ar }),
    },
    {
      header: 'تاريخ الولادة المتوقع',
      accessor: (record: BreedingRecord) => 
        record.expectedBirthDate 
          ? format(new Date(record.expectedBirthDate), 'yyyy/MM/dd', { locale: ar })
          : '-',
    },
    {
      header: 'الحالة',
      accessor: (record: BreedingRecord) => {
        let statusClass = '';
        
        switch (record.status) {
          case 'في انتظار الولادة':
            statusClass = 'status-badge status-badge-yellow';
            break;
          case 'ولادة ناجحة':
            statusClass = 'status-badge status-badge-green';
            break;
          case 'فشل':
            statusClass = 'status-badge status-badge-red';
            break;
          default:
            statusClass = 'status-badge status-badge-gray';
        }
        
        return <span className={statusClass}>{record.status}</span>;
      },
    },
    {
      header: 'عدد الصغار',
      accessor: (record: BreedingRecord) => record.litterSize || '-',
    },
    {
      header: 'إجراءات',
      accessor: (record: BreedingRecord) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleViewRecord(record);
          }}>
            <span className="material-icons text-sm">visibility</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleEditRecord(record);
          }}>
            <span className="material-icons text-sm">edit</span>
          </Button>
          {record.status === 'في انتظار الولادة' && (
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              handleRecordResult(record);
            }}>
              <span className="material-icons text-sm">assignment_turned_in</span>
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">سجلات التكاثر</h1>
        <Button onClick={handleAddRecord}>
          <span className="material-icons ml-2">add</span>
          إضافة سجل جديد
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all">
            الكل
            <Badge variant="secondary" className="mr-2">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            في انتظار الولادة
            <Badge variant="secondary" className="mr-2">{statusCounts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="success">
            ولادة ناجحة
            <Badge variant="secondary" className="mr-2">{statusCounts.success}</Badge>
          </TabsTrigger>
          <TabsTrigger value="failed">
            فشل
            <Badge variant="secondary" className="mr-2">{statusCounts.failed}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>قائمة سجلات التكاثر</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRecords}
            columns={columns}
            keyField="id"
            onRowClick={handleViewRecord}
            emptyMessage="لا توجد سجلات للعرض"
          />
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedRecord ? 'تعديل سجل تكاثر' : 'إضافة سجل تكاثر جديد'}</DialogTitle>
          </DialogHeader>
          <BreedingForm
            breedingId={selectedRecord?.id}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      {selectedRecord && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>تفاصيل سجل التكاثر</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">رقم الذكر:</p>
                <p>{selectedRecord.maleId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">رقم الأنثى:</p>
                <p>{selectedRecord.femaleId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ التزاوج:</p>
                <p>{format(new Date(selectedRecord.matingDate), 'PPP', { locale: ar })}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ الولادة المتوقع:</p>
                <p>{selectedRecord.expectedBirthDate 
                  ? format(new Date(selectedRecord.expectedBirthDate), 'PPP', { locale: ar })
                  : 'غير محدد'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الحالة:</p>
                <p>{selectedRecord.status}</p>
              </div>
              
              {selectedRecord.status === 'ولادة ناجحة' && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">تاريخ الولادة الفعلي:</p>
                    <p>{selectedRecord.actualBirthDate 
                      ? format(new Date(selectedRecord.actualBirthDate), 'PPP', { locale: ar })
                      : 'غير محدد'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">عدد الصغار الكلي:</p>
                    <p>{selectedRecord.litterSize || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">عدد الصغار على قيد الحياة:</p>
                    <p>{selectedRecord.litterAlive || 0}</p>
                  </div>
                </>
              )}
            </div>
            
            {selectedRecord.notes && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">ملاحظات:</p>
                <p className="text-sm">{selectedRecord.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 space-x-reverse mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEditRecord(selectedRecord);
              }}>
                تعديل
              </Button>
              {selectedRecord.status === 'في انتظار الولادة' && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleRecordResult(selectedRecord);
                }}>
                  تسجيل النتيجة
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Record Result Dialog */}
      {selectedRecord && (
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>تسجيل نتيجة التكاثر</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">الأنثى: <span className="font-medium">{selectedRecord.femaleId}</span></p>
                <p className="text-sm">تاريخ التزاوج: <span className="font-medium">{format(new Date(selectedRecord.matingDate), 'PPP', { locale: ar })}</span></p>
                <p className="text-sm">تاريخ الولادة المتوقع: <span className="font-medium">
                  {selectedRecord.expectedBirthDate 
                    ? format(new Date(selectedRecord.expectedBirthDate), 'PPP', { locale: ar })
                    : format(addDays(new Date(selectedRecord.matingDate), 31), 'PPP', { locale: ar })}
                </span></p>
              </div>
              
              <div className="space-y-4 pt-4">
                <Button 
                  onClick={() => {
                    setIsResultDialogOpen(false);
                    
                    // Create a little form to get litter size
                    const litterSize = prompt('أدخل عدد الصغار الكلي:', '0');
                    if (litterSize === null) return;
                    
                    const litterAlive = prompt('أدخل عدد الصغار على قيد الحياة:', litterSize);
                    if (litterAlive === null) return;
                    
                    confirmResult('success', parseInt(litterSize), parseInt(litterAlive));
                  }}
                  className="w-full"
                >
                  <span className="material-icons ml-2">check_circle</span>
                  ولادة ناجحة
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsResultDialogOpen(false);
                    confirmResult('failed');
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  <span className="material-icons ml-2">cancel</span>
                  فشل في الولادة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default BreedingRecords;
