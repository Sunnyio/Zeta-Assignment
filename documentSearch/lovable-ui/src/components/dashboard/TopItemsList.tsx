
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TopItemsListProps {
  title: string;
  description?: string;
  items: {
    name: string;
    value: number;
  }[];
  maxItems?: number;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
}

export const TopItemsList: React.FC<TopItemsListProps> = ({
  title,
  description,
  items = [],
  maxItems = 5,
  valueFormatter = (value) => value.toString(),
  emptyMessage = "No data available"
}) => {
  const maxValue = Math.max(...items.map(item => item.value), 1);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
        ) : (
          <ul className="space-y-4">
            {items.slice(0, maxItems).map((item, index) => (
              <li key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm truncate max-w-[70%]" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold">{valueFormatter(item.value)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-insight-400 h-2 rounded-full" 
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default TopItemsList;
