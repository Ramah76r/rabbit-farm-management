import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import HealthRecordForm from '@/components/health/HealthRecordForm';
import DataTable from '@/components/DataTable';
import { getHealthRecords, getHealthRecordById, getRabbitByTagId, updateRabbit, updateHealthRecord } from '@/lib/data';
import { HealthRecord } from '@shared/schema';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { HEALTH_RECORD_TYPES } from '@/utils/constants';

const Health: React.FC = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadRecords();
  }, [refreshKey, user]);
  
  const loadRecords = () => {
    let allRecords = getHealthRecords();
    
    // For worker, filter only assigned rabbits
    if (user?.role === 'worker' && user.assignedRabbits) {
      const assignedRabbits = user.assignedRabbits as string[];
      allRecords = allRecords.filter(record => 
        assignedRabbits.includes(record.rabbitId)
      );
    }
    
    // Sort by record date, newest first
    allRecords.sort((a, b) => 
      new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
    );
    
    setRecords(allRecords);
  };
  
  const handleAddRecord = (rabbitId?: string) => {
    setSelectedRecord(null);
    setIsFormDialogOpen(true);
  };
  
  const handleEditRecord = (record: HealthRecord) => {
    setSelectedRecord(record);
    setIsFormDialogOpen(true);
  };
  
  const handleViewRecord = (record: HealthRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Update rabbit health status based on record type
  const updateRabbitHealthStatus = (rabbitId: string, recordType: string) => {
    const rabbit = getRabbitByTagId(rabbitId);
    if (!rabbit) return;
    
    let healthStatus = 'سليم';
    
    switch (recordType) {
      case 'مرض':
        healthStatus = 'مريض';
        break;
      case 'علاج':
        healthStatus = 'تحت العلاج';
        break;
      case 'إصابة':
        healthStatus = 'مريض';
        break;
      case 'فحص دوري':
        // Don't change if it's just a checkup
        return;
    }
    
    updateRabbit(rabbit.id, { healthStatus });
  };
  
  // Filter records based on active tab
  const filteredRecords = activeTab === 'all' 
    ? records 
    : records.filter(record => record.recordType === 
        HEALTH_RECORD_TYPES.find(type => type.toLowerCase() === activeTab.toLowerCase())
      );
  
  // Count records by type
  const typeCounts = {
    all: records.length
  };
  
  HEALTH_RECORD_TYPES.forEach(type => {
    typeCounts[type.toLowerCase()] = records.filter(record => record.recordType === type).length;
  });
  
  // Table columns
  const columns = [
    {
      header: 'رقم الأرنب',
      accessor: 'rabbitId',
    },
    {
      header: 'تاريخ السجل',
      accessor: (record: HealthRecord) => format(new Date(record.recordDate), 'yyyy/MM/dd', { locale: ar }),
    },
    {
      header: 'نوع السجل',
      accessor: 'recordType',
      cell: (record: HealthRecord) => {
        let typeClass = '';
        
        switch (record.recordType) {
          case 'تطعيم':
            typeClass = 'status-badge status-badge-green';
            break;
          case 'علاج':
            typeClass = 'status-badge status-badge-blue';
            break;
          case 'فحص دوري':
            typeClass = 'status-badge status-badge-gray';
            break;
          case 'مرض':
            typeClass = 'status-badge status-badge-red';
            break;
          case 'إصابة':
            typeClass = 'status-badge status-badge-yellow';
            break;
          default:
            typeClass = 'status-badge status-badge-gray';
        }
        
        return <span className={typeClass}>{record.recordType}</span>;
      },
    },
    {
      header: 'التشخيص',
      accessor: 'diagnosis',
      cell: (record: HealthRecord) => record.diagnosis || '-',
    },
    {
      header: 'العلاج',
      accessor: 'treatment',
      cell: (record: HealthRecord) => record.treatment || '-',
    },
    {
      header: 'إجراءات',
      accessor: (record: HealthRecord) => (
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
        </div>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">الرعاية الصحية</h1>
        <Button onClick={() => handleAddRecord()}>
          <span className="material-icons ml-2">add</span>
          إضافة سجل صحي جديد
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="all">
            الكل
            <Badge variant="secondary" className="mr-2">{typeCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="تطعيم">
            تطعيم
            <Badge variant="secondary" className="mr-2">{typeCounts['تطعيم'] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="علاج">
            علاج
            <Badge variant="secondary" className="mr-2">{typeCounts['علاج'] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="فحص دوري">
            فحص دوري
            <Badge variant="secondary" className="mr-2">{typeCounts['فحص دوري'] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="مرض">
            مرض
            <Badge variant="secondary" className="mr-2">{typeCounts['مرض'] || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="إصابة">
            إصابة
            <Badge variant="secondary" className="mr-2">{typeCounts['إصابة'] || 0}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>سجلات الرعاية الصحية</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRecords}
            columns={columns}
            keyField="id"
            searchField="rabbitId"
            onRowClick={handleViewRecord}
            emptyMessage="لا توجد سجلات صحية للعرض"
          />
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedRecord ? 'تعديل سجل صحي' : 'إضافة سجل صحي جديد'}</DialogTitle>
          </DialogHeader>
          <HealthRecordForm
            healthRecordId={selectedRecord?.id}
            rabbitId={selectedRecord?.rabbitId}
            onSuccess={() => {
              // If adding a new record, update rabbit health status
              if (selectedRecord) {
                // For updates, we don't automatically change the rabbit status
              }
              handleFormSuccess();
            }}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      {selectedRecord && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>تفاصيل السجل الصحي</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">رقم الأرنب:</p>
                <p>{selectedRecord.rabbitId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ السجل:</p>
                <p>{format(new Date(selectedRecord.recordDate), 'PPP', { locale: ar })}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">نوع السجل:</p>
                <p>{selectedRecord.recordType}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تم بواسطة:</p>
                <p>{selectedRecord.createdBy}</p>
              </div>
            </div>
            
            {selectedRecord.diagnosis && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">التشخيص:</p>
                <p className="text-sm">{selectedRecord.diagnosis}</p>
              </div>
            )}
            
            {selectedRecord.treatment && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">العلاج:</p>
                <p className="text-sm">{selectedRecord.treatment}</p>
              </div>
            )}
            
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Health;
