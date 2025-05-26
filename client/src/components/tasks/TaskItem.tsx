import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { updateTask } from '@/lib/data';
import { TASK_STATUS_LABELS } from '@/utils/constants';

interface TaskItemProps {
  id: number;
  title: string;
  dueDate?: Date;
  status: string;
  onStatusChange: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  dueDate,
  status,
  onStatusChange,
}) => {
  const isCompleted = status === 'completed';
  
  const handleStatusChange = () => {
    updateTask(id, {
      status: isCompleted ? 'pending' : 'completed',
      completedAt: isCompleted ? undefined : new Date()
    });
    onStatusChange();
  };
  
  const formatDate = (date?: Date) => {
    if (!date) return '';
    
    return format(new Date(date), 'PPp', { locale: ar });
  };
  
  return (
    <li className="flex items-center p-2 hover:bg-neutral-50 rounded-md">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => handleStatusChange()}
        className="w-5 h-5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 ml-3"
      />
      <div className="flex-1">
        <p className={`text-neutral-800 ${isCompleted ? 'line-through text-neutral-500' : ''}`}>
          {title}
        </p>
        {dueDate && (
          <p className="text-xs text-neutral-500">{formatDate(dueDate)}</p>
        )}
      </div>
      <span className="material-icons text-neutral-400 text-sm">more_vert</span>
    </li>
  );
};

export default TaskItem;
