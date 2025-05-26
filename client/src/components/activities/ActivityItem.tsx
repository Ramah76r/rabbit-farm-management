import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ActivityItemProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  time: Date;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconBgColor,
  iconColor,
  title,
  description,
  time,
}) => {
  const timeAgo = formatDistanceToNow(new Date(time), { 
    addSuffix: true,
    locale: ar 
  });
  
  return (
    <li className="py-3 flex items-start">
      <div className={`mr-4 w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center ${iconColor} flex-shrink-0`}>
        <span className="material-icons text-sm">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-neutral-800 font-medium">{title}</p>
        <p className="text-neutral-500 text-sm">{description}</p>
        <div className="flex items-center mt-1 text-xs text-neutral-400">
          <span className="material-icons text-xs mr-1">schedule</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
