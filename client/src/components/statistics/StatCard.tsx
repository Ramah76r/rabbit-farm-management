import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    text: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  change,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-sm">{title}</p>
          <h3 className="text-3xl font-bold text-neutral-800">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor}`}>
          <span className="material-icons">{icon}</span>
        </div>
      </div>
      
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`material-icons text-base ${
            change.type === 'increase' ? 'text-green-500' : 'text-red-500'
          }`}>
            {change.type === 'increase' ? 'trending_up' : 'trending_down'}
          </span>
          <span className={`mr-1 ${
            change.type === 'increase' ? 'text-green-500' : 'text-red-500'
          }`}>
            {change.value}%
          </span>
          <span className="text-neutral-500 mr-1">{change.text}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
