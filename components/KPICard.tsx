
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  subValue?: string;
  icon?: React.ReactNode;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, trend, subValue, icon, color = 'blue' }) => {
  const isPositive = trend && trend > 0;
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 group-hover:bg-${color}-600 group-hover:text-white transition-colors duration-300`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subValue && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subValue}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;
