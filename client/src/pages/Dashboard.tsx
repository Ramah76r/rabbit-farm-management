import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { farmIllustration } from '@/assets/images';
import StatCard from '@/components/statistics/StatCard';
import ProgressBar from '@/components/statistics/ProgressBar';
import ActivityItem from '@/components/activities/ActivityItem';
import TaskItem from '@/components/tasks/TaskItem';
import TaskForm from '@/components/tasks/TaskForm';
import { 
  getRabbits, 
  getBreedingRecords, 
  getHealthRecords, 
  getFeedInventory,
  getRecentActivities,
  getTasks,
  addTask
} from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Dashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Stats data
  const [stats, setStats] = useState({
    totalRabbits: 0,
    activeBreeding: 0,
    activeMedical: 0,
    feedStock: 0,
    ageDistribution: {
      young: 0,
      adult: 0,
      senior: 0
    },
    breedDistribution: {} as Record<string, number>,
    quickStats: {
      birthRate: 0,
      averageLitterSize: 0,
      mortalityRate: 0,
      rabbitsForSale: 0,
      availableCages: 12 // Default value
    }
  });
  
  const [activities, setActivities] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<any[]>([]);
  
  // Load data
  useEffect(() => {
    const loadData = () => {
      const rabbits = getRabbits();
      const breeding = getBreedingRecords();
      const health = getHealthRecords();
      const feed = getFeedInventory();
      const recentActivities = getRecentActivities(5);
      const allTasks = getTasks();
      
      // Calculate stats
      const youngRabbits = rabbits.filter(rabbit => {
        if (!rabbit.birthDate) return false;
        const birthDate = new Date(rabbit.birthDate);
        const ageInMonths = (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return ageInMonths <= 3;
      });
      
      const adultRabbits = rabbits.filter(rabbit => {
        if (!rabbit.birthDate) return false;
        const birthDate = new Date(rabbit.birthDate);
        const ageInMonths = (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return ageInMonths > 3 && ageInMonths <= 12;
      });
      
      const seniorRabbits = rabbits.filter(rabbit => {
        if (!rabbit.birthDate) return false;
        const birthDate = new Date(rabbit.birthDate);
        const ageInMonths = (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return ageInMonths > 12;
      });
      
      const breedDistribution: Record<string, number> = {};
      rabbits.forEach(rabbit => {
        breedDistribution[rabbit.breed] = (breedDistribution[rabbit.breed] || 0) + 1;
      });
      
      // Calculate breeding stats
      const successfulBreedings = breeding.filter(record => record.status === 'ولادة ناجحة');
      const averageLitterSize = successfulBreedings.length > 0
        ? successfulBreedings.reduce((sum, record) => sum + (record.litterSize || 0), 0) / successfulBreedings.length
        : 0;
      
      const totalBorn = successfulBreedings.reduce((sum, record) => sum + (record.litterSize || 0), 0);
      const totalAlive = successfulBreedings.reduce((sum, record) => sum + (record.litterAlive || 0), 0);
      const mortalityRate = totalBorn > 0 ? ((totalBorn - totalAlive) / totalBorn) * 100 : 0;
      
      // Update stats
      setStats({
        totalRabbits: rabbits.length,
        activeBreeding: breeding.filter(record => record.status === 'في انتظار الولادة').length,
        activeMedical: rabbits.filter(rabbit => rabbit.healthStatus !== 'سليم').length,
        feedStock: feed.reduce((sum, item) => sum + item.quantity, 0) / 1000, // Convert to kg
        ageDistribution: {
          young: youngRabbits.length,
          adult: adultRabbits.length,
          senior: seniorRabbits.length
        },
        breedDistribution,
        quickStats: {
          birthRate: successfulBreedings.length,
          averageLitterSize: parseFloat(averageLitterSize.toFixed(1)),
          mortalityRate: parseFloat(mortalityRate.toFixed(1)),
          rabbitsForSale: rabbits.filter(rabbit => rabbit.status === 'للبيع').length,
          availableCages: 12 // Default value
        }
      });
      
      // Get activities and tasks
      setActivities(recentActivities);
      
      // Filter tasks based on user role
      if (user?.role === 'worker') {
        setTasks(allTasks.filter(task => task.assignedTo === user.id));
      } else {
        setTasks(allTasks);
      }
      
      // Get recent breeding records
      setBreedingRecords(breeding.slice(0, 4));
    };
    
    loadData();
  }, [refreshKey, user?.id, user?.role]);
  
  // Calculate percentages for distribution charts
  const totalRabbits = stats.ageDistribution.young + stats.ageDistribution.adult + stats.ageDistribution.senior;
  const youngPercentage = totalRabbits > 0 ? Math.round((stats.ageDistribution.young / totalRabbits) * 100) : 0;
  const adultPercentage = totalRabbits > 0 ? Math.round((stats.ageDistribution.adult / totalRabbits) * 100) : 0;
  const seniorPercentage = totalRabbits > 0 ? Math.round((stats.ageDistribution.senior / totalRabbits) * 100) : 0;
  
  // Get top breeds
  const topBreeds = Object.entries(stats.breedDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  
  const breedPercentages = topBreeds.map(([breed, count]) => ({
    breed,
    percentage: totalRabbits > 0 ? Math.round((count / totalRabbits) * 100) : 0
  }));
  
  // Add "أخرى" category if needed
  const topBreedsTotal = topBreeds.reduce((sum, [_, count]) => sum + count, 0);
  const otherBreeds = totalRabbits - topBreedsTotal;
  
  if (otherBreeds > 0) {
    breedPercentages.push({
      breed: 'أنواع أخرى',
      percentage: totalRabbits > 0 ? Math.round((otherBreeds / totalRabbits) * 100) : 0
    });
  }
  
  // Handlers
  const handleTaskStatusChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const handleAddTask = () => {
    setIsTaskDialogOpen(true);
  };
  
  const handleTaskSuccess = () => {
    setIsTaskDialogOpen(false);
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الأرانب"
          value={stats.totalRabbits}
          icon="pets"
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          change={{ value: 12, type: 'increase', text: 'من الشهر الماضي' }}
        />
        
        <StatCard
          title="عمليات التكاثر النشطة"
          value={stats.activeBreeding}
          icon="favorite"
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          change={{ value: 8, type: 'increase', text: 'من الشهر الماضي' }}
        />
        
        <StatCard
          title="حالات طبية نشطة"
          value={stats.activeMedical}
          icon="medical_services"
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          change={{ value: 3, type: 'decrease', text: 'من الشهر الماضي' }}
        />
        
        <StatCard
          title="مخزون الأعلاف (كجم)"
          value={stats.feedStock.toFixed(1)}
          icon="restaurant"
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          change={{ value: 5, type: 'decrease', text: 'من الشهر الماضي' }}
        />
      </div>
      
      {/* Farm Overview Section */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">نظرة عامة على المزرعة</h3>
        </div>
        <div className="p-6">
          {/* Farm illustration */}
          <div 
            className="w-full h-48 bg-neutral-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden"
            dangerouslySetInnerHTML={{ __html: farmIllustration }}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-neutral-800 font-medium mb-2">توزيع الأعمار</h4>
              <div className="space-y-3">
                <ProgressBar
                  label="صغار (0-3 أشهر)"
                  value={youngPercentage}
                />
                <ProgressBar
                  label="بالغين (3-12 شهر)"
                  value={adultPercentage}
                />
                <ProgressBar
                  label="كبار (أكثر من سنة)"
                  value={seniorPercentage}
                />
              </div>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-neutral-800 font-medium mb-2">توزيع الأنواع</h4>
              <div className="space-y-3">
                {breedPercentages.map((item, index) => (
                  <ProgressBar
                    key={item.breed}
                    label={item.breed}
                    value={item.percentage}
                    color={index < 4 ? "bg-secondary-500" : "bg-neutral-400"}
                  />
                ))}
              </div>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-neutral-800 font-medium mb-2">إحصائيات سريعة</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-neutral-600">معدل الولادات (شهرياً)</span>
                  <span className="font-medium">{stats.quickStats.birthRate}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-neutral-600">متوسط ​​حجم البطن</span>
                  <span className="font-medium">{stats.quickStats.averageLitterSize}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-neutral-600">معدل الوفيات</span>
                  <span className="font-medium">{stats.quickStats.mortalityRate}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-neutral-600">أرانب للبيع</span>
                  <span className="font-medium">{stats.quickStats.rabbitsForSale}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-neutral-600">أقفاص متاحة</span>
                  <span className="font-medium">{stats.quickStats.availableCages}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activities and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-neutral-800">النشاطات الأخيرة</h3>
            <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0">
              عرض الكل
            </Button>
          </div>
          <div className="p-4">
            <ul className="divide-y divide-neutral-200">
              {activities.length > 0 ? (
                activities.map((activity) => {
                  let icon = 'info';
                  let iconBgColor = 'bg-blue-100';
                  let iconColor = 'text-blue-600';
                  let title = 'نشاط';
                  
                  switch (activity.activityType) {
                    case 'create':
                      icon = 'add_circle';
                      iconBgColor = 'bg-green-100';
                      iconColor = 'text-green-600';
                      title = 'إضافة جديدة';
                      break;
                    case 'update':
                      icon = 'edit';
                      iconBgColor = 'bg-blue-100';
                      iconColor = 'text-blue-600';
                      title = 'تحديث';
                      break;
                    case 'delete':
                      icon = 'delete';
                      iconBgColor = 'bg-red-100';
                      iconColor = 'text-red-600';
                      title = 'حذف';
                      break;
                    case 'login':
                      icon = 'login';
                      iconBgColor = 'bg-purple-100';
                      iconColor = 'text-purple-600';
                      title = 'تسجيل دخول';
                      break;
                  }
                  
                  return (
                    <ActivityItem
                      key={activity.id}
                      icon={icon}
                      iconBgColor={iconBgColor}
                      iconColor={iconColor}
                      title={title}
                      description={activity.description}
                      time={new Date(activity.timestamp)}
                    />
                  );
                })
              ) : (
                <li className="py-6 text-center text-neutral-500">
                  لا توجد نشاطات حديثة
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-800">المهام القادمة</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {tasks.length > 0 ? (
                tasks.slice(0, 4).map((task) => (
                  <TaskItem
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    dueDate={task.dueDate ? new Date(task.dueDate) : undefined}
                    status={task.status}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))
              ) : (
                <li className="py-6 text-center text-neutral-500">
                  لا توجد مهام قادمة
                </li>
              )}
            </ul>
            
            <Button 
              variant="outline" 
              className="mt-4 w-full flex items-center justify-center py-2 px-4 border-dashed" 
              onClick={handleAddTask}
            >
              <span className="material-icons text-sm ml-1">add</span>
              إضافة مهمة جديدة
            </Button>
          </div>
        </div>
      </div>
      
      {/* Breeding Records Preview */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-neutral-800">سجلات التكاثر الأخيرة</h3>
          <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0">
            عرض الكل
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  رقم الذكر
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  رقم الأنثى
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  تاريخ التزاوج
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  تاريخ الولادة المتوقع
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  عدد الصغار
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">إجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {breedingRecords.length > 0 ? (
                breedingRecords.map((record) => {
                  const statusClass = 
                    record.status === 'ولادة ناجحة' 
                      ? 'bg-green-100 text-green-800'
                      : record.status === 'في انتظار الولادة' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800';
                  
                  return (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {record.maleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {record.femaleId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {new Date(record.matingDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {record.expectedBirthDate 
                          ? new Date(record.expectedBirthDate).toLocaleDateString('ar-EG')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {record.litterSize || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <button className="text-primary-600 hover:text-primary-900">تفاصيل</button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-neutral-500">
                    لا توجد سجلات تكاثر
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSuccess={handleTaskSuccess}
            onCancel={() => setIsTaskDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
