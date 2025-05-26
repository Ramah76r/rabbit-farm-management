import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  color = 'bg-primary-500',
}) => {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
