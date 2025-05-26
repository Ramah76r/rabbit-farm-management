import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import FeedInventoryForm from '@/components/feed/FeedInventoryForm';
import FeedConsumptionForm from '@/components/feed/FeedConsumptionForm';
import DataTable from '@/components/DataTable';
import { 
  getFeedInventory, 
  getFeedInventoryById, 
  updateFeedInventory,
  getFeedConsumption
} from '@/lib/data';
import { FeedInventory, FeedConsumption } from '@shared/schema';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

const FeedManagement: React.FC = () => {
  const { user, isAdmin, isManager } = useAuthContext();
  const { toast } = useToast();
  const [feedItems, setFeedItems] = useState<FeedInventory[]>([]);
  const [consumptionItems, setConsumptionItems] = useState<FeedConsumption[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<FeedInventory | null>(null);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [isConsumptionFormOpen, setIsConsumptionFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('inventory');
  
  useEffect(() => {
    loadData();
  }, [refreshKey]);
  
  const loadData = () => {
    const inventory = getFeedInventory();
    const consumption = getFeedConsumption();
    
    // Sort inventory by acquisition date, newest first
    inventory.sort((a, b) => 
      new Date(b.acquired).getTime() - new Date(a.acquired).getTime()
    );
    
    // Sort consumption by date, newest first
    consumption.sort((a, b) => 
      new Date(b.consumptionDate).getTime() - new Date(a.consumptionDate).getTime()
    );
    
    setFeedItems(inventory);
    setConsumptionItems(consumption);
  };
  
  const handleAddInventory = () => {
    setSelectedFeed(null);
    setIsInventoryFormOpen(true);
  };
  
  const handleEditInventory = (feed: FeedInventory) => {
    setSelectedFeed(feed);
    setIsInventoryFormOpen(true);
  };
  
  const handleViewInventory = (feed: FeedInventory) => {
    setSelectedFeed(feed);
    setIsViewDialogOpen(true);
  };
  
  const handleAddConsumption = () => {
    setIsConsumptionFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsInventoryFormOpen(false);
    setIsConsumptionFormOpen(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Calculate total feed in inventory
  const totalFeed = feedItems.reduce((total, item) => total + item.quantity, 0);
  
  // Group feed by type
  const feedByType = feedItems.reduce((acc, item) => {
    acc[item.feedType] = (acc[item.feedType] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate percentage by type
  const feedPercentages = Object.entries(feedByType).map(([type, quantity]) => ({
    type,
    quantity,
    percentage: totalFeed > 0 ? (quantity / totalFeed) * 100 : 0
  }));
  
  // Sort by quantity, highest first
  feedPercentages.sort((a, b) => b.quantity - a.quantity);
  
  // Inventory table columns
  const inventoryColumns = [
    {
      header: 'نوع العلف',
      accessor: 'feedType',
    },
    {
      header: 'الكمية (جرام)',
      accessor: 'quantity',
      cell: (feed: FeedInventory) => feed.quantity.toLocaleString(),
    },
    {
      header: 'تاريخ الاستلام',
      accessor: (feed: FeedInventory) => format(new Date(feed.acquired), 'yyyy/MM/dd', { locale: ar }),
    },
    {
      header: 'تاريخ انتهاء الصلاحية',
      accessor: (feed: FeedInventory) => 
        feed.expirationDate 
          ? format(new Date(feed.expirationDate), 'yyyy/MM/dd', { locale: ar })
          : '-',
    },
    {
      header: 'التكلفة',
      accessor: (feed: FeedInventory) => feed.cost ? `${feed.cost} جنيه` : '-',
    },
    {
      header: 'إجراءات',
      accessor: (feed: FeedInventory) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            handleViewInventory(feed);
          }}>
            <span className="material-icons text-sm">visibility</span>
          </Button>
          {(isAdmin || isManager) && (
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              handleEditInventory(feed);
            }}>
              <span className="material-icons text-sm">edit</span>
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  // Consumption table columns
  const consumptionColumns = [
    {
      header: 'نوع العلف',
      accessor: (consumption: FeedConsumption) => {
        const feed = feedItems.find(item => item.id === consumption.feedId);
        return feed ? feed.feedType : '-';
      },
    },
    {
      header: 'الكمية (جرام)',
      accessor: 'quantity',
      cell: (consumption: FeedConsumption) => consumption.quantity.toLocaleString(),
    },
    {
      header: 'تاريخ الاستهلاك',
      accessor: (consumption: FeedConsumption) => format(new Date(consumption.consumptionDate), 'yyyy/MM/dd', { locale: ar }),
    },
    {
      header: 'المجموعة/القفص',
      accessor: 'groupId',
      cell: (consumption: FeedConsumption) => consumption.groupId || '-',
    },
    {
      header: 'ملاحظات',
      accessor: 'notes',
      cell: (consumption: FeedConsumption) => consumption.notes || '-',
    },
  ];
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة الأعلاف</h1>
        <div className="space-x-2 space-x-reverse">
          <Button onClick={handleAddConsumption}>
            <span className="material-icons ml-2">remove_circle</span>
            تسجيل استهلاك
          </Button>
          {(isAdmin || isManager) && (
            <Button onClick={handleAddInventory}>
              <span className="material-icons ml-2">add_circle</span>
              إضافة مخزون
            </Button>
          )}
        </div>
      </div>
      
      {/* Feed Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>إجمالي المخزون</CardTitle>
            <CardDescription>إجمالي كمية العلف المتاحة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{(totalFeed / 1000).toFixed(2)} كجم</div>
            <p className="text-sm text-muted-foreground">
              {feedItems.length} نوع من الأعلاف في المخزون
            </p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>توزيع الأعلاف حسب النوع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedPercentages.slice(0, 3).map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {(item.quantity / 1000).toFixed(2)} كجم ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="inventory">
            المخزون
          </TabsTrigger>
          <TabsTrigger value="consumption">
            سجلات الاستهلاك
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>مخزون الأعلاف</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={feedItems}
                columns={inventoryColumns}
                keyField="id"
                searchField="feedType"
                onRowClick={handleViewInventory}
                emptyMessage="لا توجد أعلاف في المخزون"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle>سجلات استهلاك الأعلاف</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={consumptionItems}
                columns={consumptionColumns}
                keyField="id"
                emptyMessage="لا توجد سجلات استهلاك"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Inventory Form Dialog */}
      <Dialog open={isInventoryFormOpen} onOpenChange={setIsInventoryFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedFeed ? 'تعديل مخزون علف' : 'إضافة مخزون علف جديد'}</DialogTitle>
          </DialogHeader>
          <FeedInventoryForm
            feedId={selectedFeed?.id}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsInventoryFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Consumption Form Dialog */}
      <Dialog open={isConsumptionFormOpen} onOpenChange={setIsConsumptionFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>تسجيل استهلاك علف</DialogTitle>
          </DialogHeader>
          <FeedConsumptionForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsConsumptionFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Feed Dialog */}
      {selectedFeed && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>تفاصيل العلف</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">نوع العلف:</p>
                <p>{selectedFeed.feedType}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">الكمية:</p>
                <p>{selectedFeed.quantity.toLocaleString()} جرام ({(selectedFeed.quantity / 1000).toFixed(2)} كجم)</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ الاستلام:</p>
                <p>{format(new Date(selectedFeed.acquired), 'PPP', { locale: ar })}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ انتهاء الصلاحية:</p>
                <p>{selectedFeed.expirationDate 
                  ? format(new Date(selectedFeed.expirationDate), 'PPP', { locale: ar })
                  : 'غير محدد'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">التكلفة:</p>
                <p>{selectedFeed.cost ? `${selectedFeed.cost} جنيه` : 'غير محدد'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">تاريخ الإضافة:</p>
                <p>{format(new Date(selectedFeed.createdAt), 'PPP', { locale: ar })}</p>
              </div>
            </div>
            
            {selectedFeed.supplierInfo && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">معلومات المورد:</p>
                <p className="text-sm">{selectedFeed.supplierInfo}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 space-x-reverse mt-4">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                إغلاق
              </Button>
              {(isAdmin || isManager) && (
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditInventory(selectedFeed);
                }}>
                  تعديل
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FeedManagement;
