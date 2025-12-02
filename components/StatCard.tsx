import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">{value}</h3>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
