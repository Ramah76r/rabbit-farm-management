import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8">
            سيتم إضافة إدارة المستخدمين قريبًا
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default UserManagement;