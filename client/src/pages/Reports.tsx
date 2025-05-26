import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Reports: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">التقارير</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>التقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8">
            سيتم إضافة التقارير قريبًا
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default Reports;