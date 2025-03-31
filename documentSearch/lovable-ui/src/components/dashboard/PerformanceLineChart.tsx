
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, TooltipProps 
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface PerformanceLineChartProps {
  data: { date: string; [key: string]: any }[];
  title: string;
  lines: {
    key: string;
    color: string;
    name: string;
    formatter?: (value: number) => string;
  }[];
}

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ data, title, lines }) => {
  // Sort data chronologically
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      ...item,
      dateFormatted: format(parseISO(item.date), 'MMM dd')
    }));

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="font-medium">{format(parseISO(label), 'MMM dd, yyyy')}</p>
          {payload.map((entry, index) => {
            const line = lines.find(l => l.key === entry.dataKey);
            const formattedValue = line?.formatter ? 
              line.formatter(entry.value) : 
              entry.value.toFixed(2);
              
            return (
              <p key={index} style={{ color: entry.color }} className="font-semibold">
                {line?.name || entry.dataKey}: {formattedValue}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="dateFormatted"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.color}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  dot={{ stroke: line.color, strokeWidth: 2, fill: 'white', r: 3 }}
                  name={line.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceLineChart;
