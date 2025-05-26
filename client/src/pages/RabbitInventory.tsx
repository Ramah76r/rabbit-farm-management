import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import RabbitForm from '@/components/rabbits/RabbitForm';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getRabbits, getRabbitById, updateRabbit } from '@/lib/data';
import { Rabbit } from '@shared/schema';
import { RABBIT_STATUSES, HEALTH_STATUSES } from '@/utils/constants';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RabbitInventory: React.FC = () => {
  const { user, isAdmin, isManager } = useAuthContext();
  const { toast } = useToast();
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [selectedRabbit, setSelectedRabbit] = useState<Rabbit | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    loadRabbits();
  }, [refreshKey, user]);
  
  const loadRabbits = () => {
    let allRabbits = getRabbits();
    
    // For worker, filter only assigned rabbits
    if (user?.role === 'worker' && user.assignedRabbits) {
      const assignedRabbits = user.assignedRabbits as string[];
      allRabbits = allRabbits.filter(rabbit => 
        assignedRabbits.includes(rabbit.tagId)
      );
    }
    
    // Sort by creation date, newest first
    allRabbits.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setRabbits(allRabbits);
  };
  
  const handleAddRabbit = () => {
    setIsEditMode(false);
    setSelectedRabbit(null);
    setIsFormDialogOpen(true);
  };
  
  const handleEditRabbit = (rabbit: Rabbit) => {
    setIsEditMode(true);
    setSelectedRabbit(rabbit);
    setIsFormDialogOpen(true);
  };
  
  const handleViewRabbit = (rabbit: Rabbit) => {
    setSelectedRabbit(rabbit);
    setIsViewDialogOpen(true);
  };
  
  const handleDeleteRabbit = (rabbit: Rabbit) => {
    setSelectedRabbit(rabbit);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedRabbit) return;
    
    try {
      updateRabbit(selectedRabbit.id, {
        status: 'نافق',
      });
      
      toast({
        title: 'تم تحديث حالة الأرنب',
        description: `تم تغيير حالة الأرنب ${selectedRabbit.tagId} إلى نافق`,
        variant: 'success',
      });
      
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث حالة الأرنب',
        variant: 'destructive',
      });
    }
  };
  
  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Filter rabbits based on active tab
  const filteredRabbits = activeTab === 'all' 
    ? rabbits 
    : rabbits.filter(rabbit => 
        activeTab === 'active' 
          ? rabbit.status === 'نشط' 
          : activeTab === 'pregnant' 
            ? rabbit.status === 'حامل'
            : activeTab === 'forSale'
              ? rabbit.status === 'للبيع'
              : activeTab === 'sick'
                ? rabbit.healthStatus !== 'سليم'
                : rabbit.status === 'نافق'
      );
  
  // Count rabbits by status
  const statusCounts = {
    all: rabbits.length,
    active: rabbits.filter(rabbit => rabbit.status === 'نشط').length,
    pregnant: rabbits.filter(rabbit => rabbit.status === 'حامل').length,
    forSale: rabbits.filter(rabbit => rabbit.status === 'للبيع').length,
    sick: rabbits.filter(rabbit => rabbit.healthStatus !== 'سليم').length,
    dead: rabbits.filter(rabbit => rabbit.status === 'نافق').length,
  };
  
  // Table columns
  const columns = [
    {
      header: 'رقم التعريف',
      accessor: 'tagId',
    },
    {
      header: 'النوع',
      accessor: 'breed',
    },
    {
      header: 'الجنس',
      accessor: 'gender',
    },
    {
      header: 'العمر',
      accessor: (rabbit: Rabbit) => {
        if (!rabbit.birthDate) return 'غير معروف';
        
        const birthDate = new Date(rabbit.birthDate);
        const now = new Date();
        const diffInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                           now.getMonth() - birthDate.getMonth();
        
        if (diffInMonths < 1) {
          const diffInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
          return `${diffInDays} يوم`;
        } else if (diffInMonths < 12) {
          return `${diffInMonths} شهر`;
        } else {
          const years = Math.floor(diffInMonths / 12);
          const months = diffInMonths % 12;
          return `${years} سنة${months > 0 ? ` و ${months} شهر` : ''}`;
        }
      },
    },
    {
      header: 'الحالة',
      accessor: (rabbit: Rabbit) => {
        let statusClass = '';
        
        switch (rabbit.status) {
          case 'نشط':
            statusClass = 'status-badge status-badge-green';
            break;
          case 'حامل':
            statusClass = 'status-badge status-badge-blue';
            break;
          case 'مريض':
            statusClass = 'status-badge status-badge-yellow';
            break;
          case 'للبيع':
            statusClass = 'status-badge status-badge-blue';
            break;
          case 'غير نشط':
            statusClass = 'status-badge status-badge-gray';
            break;
          case 'نافق':
            statusClass = 'status-badge status-badge-red';
            break;
          default:
            statusClass = 'status-badge status-badge-gray';
        }
        
        return <span className={statusClass}>{rabbit.status}</span>;
      },
    },
    {
      header: 'الحالة الصحية',
      accessor: (rabbit: Rabbit) => {
        let statusClass = '';
        
        switch (rabbit.healthStatus) {
          case 'سليم':
            statusClass = 'status-badge status-badge-green';
            break;
          case 'مريض':
            statusClass = 'status-badge status-badge-red';
            break;
          case 'تحت العلاج':
            statusClass = 'status-badge status-badge-yellow';
            break;
          case 'في فترة نقاهة':
            statusClass = 'status-badge status-badge-blue';
            break;
          default:
            statusClass = 'status-badge status-badge-gray';
        }
        
        return <span className={statusClass}>{rabbit.healthStatus}</span>;
      },
    },
    {
      header: 'إجراءات',
      accessor: (rabbit: Rabbit) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={() => handleViewRabbit(rabbit)}>
            <span className="material-icons text-sm">visibility</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEditRabbit(rabbit)}>
            <span className="material-icons text-sm">edit</span>
          </Button>
          {(isAdmin || isManager) && rabbit.status !== 'نافق' && (
            <Button variant="ghost" size="sm" onClick={() => handleDeleteRabbit(rabbit)}>
              <span className="material-icons text-sm">delete</span>
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مخزون الأرانب</h1>
        <Button onClick={handleAddRabbit}>
          <span className="material-icons ml-2">add</span>
          إضافة أرنب جديد
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="all">
            الكل
            <Badge variant="secondary" className="mr-2">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            نشط
            <Badge variant="secondary" className="mr-2">{statusCounts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pregnant">
            حامل
            <Badge variant="secondary" className="mr-2">{statusCounts.pregnant}</Badge>
          </TabsTrigger>
          <TabsTrigger value="forSale">
            للبيع
            <Badge variant="secondary" className="mr-2">{statusCounts.forSale}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sick">
            مريض
            <Badge variant="secondary" className="mr-2">{statusCounts.sick}</Badge>
          </TabsTrigger>
          <TabsTrigger value="dead">
            نافق
            <Badge variant="secondary" className="mr-2">{statusCounts.dead}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأرانب</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredRabbits}
            columns={columns}
            keyField="id"
            searchField="tagId"
            onRowClick={handleViewRabbit}
            emptyMessage="لا توجد أرانب للعرض"
          />
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'تعديل بيانات أرنب' : 'إضافة أرنب جديد'}</DialogTitle>
          </DialogHeader>
          <RabbitForm
            rabbitId={selectedRabbit?.id}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      {selectedRabbit && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>بيانات الأرنب: {selectedRabbit.tagId}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">رقم التعريف:</p>
                <p>{selectedRabbit.tagId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">النوع:</p>
                <p>{selectedRabbit.breed}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الجنس:</p>
                <p>{selectedRabbit.gender}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ الميلاد:</p>
                <p>{selectedRabbit.birthDate 
                  ? format(new Date(selectedRabbit.birthDate), 'PPP', { locale: ar })
                  : 'غير معروف'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ الاستحواذ:</p>
                <p>{format(new Date(selectedRabbit.acquiredDate), 'PPP', { locale: ar })}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الحالة:</p>
                <p>{selectedRabbit.status}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الحالة الصحية:</p>
                <p>{selectedRabbit.healthStatus}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الوزن:</p>
                <p>{selectedRabbit.weight ? `${selectedRabbit.weight} جرام` : 'غير معروف'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">رقم القفص:</p>
                <p>{selectedRabbit.cageNumber || 'غير معروف'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الأب:</p>
                <p>{selectedRabbit.parentMaleId || 'غير معروف'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الأم:</p>
                <p>{selectedRabbit.parentFemaleId || 'غير معروف'}</p>
              </div>
            </div>
            
            {selectedRabbit.notes && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">ملاحظات:</p>
                <p className="text-sm">{selectedRabbit.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 space-x-reverse mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                إغلاق
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEditRabbit(selectedRabbit);
              }}>
                تعديل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="تغيير حالة الأرنب"
        description={`هل أنت متأكد من تغيير حالة الأرنب ${selectedRabbit?.tagId} إلى نافق؟`}
        confirmText="تأكيد"
        cancelText="إلغاء"
        variant="destructive"
      />
    </>
  );
};

export default RabbitInventory;
