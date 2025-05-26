import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">الإعدادات</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>إعدادات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8">
            سيتم إضافة إعدادات النظام قريبًا
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default Settings;