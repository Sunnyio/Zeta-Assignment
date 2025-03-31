
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  className 
}) => {
  return (
    <Card className={cn("card-hover", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            <span className="text-muted-foreground">vs. last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
