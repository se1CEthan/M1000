import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    trend: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    trend: 'text-purple-600'
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
    trend: 'text-yellow-600'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    trend: 'text-red-600'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    trend: 'text-gray-600'
  }
};

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 lg:gap-6`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colors = colorClasses[stat.color];
        
        return (
          <Card 
            key={index} 
            className={`transition-all duration-200 hover:shadow-md ${
              stat.onClick ? 'cursor-pointer hover:scale-105' : ''
            }`}
            onClick={stat.onClick}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                  {stat.trend && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${colors.trend}`}>
                      <span className={stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}>
                        {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                      </span>
                      <span className="text-muted-foreground">{stat.trend.label}</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}