
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';

interface QueryVolumeChartProps {
  data: { date: string; query_volume: number }[];
}

export const QueryVolumeChart: React.FC<QueryVolumeChartProps> = ({ data }) => {
  // Format the data for the chart
  const chartData = data.map(item => ({
    date: item.date,
    queries: item.query_volume,
    dateFormatted: format(parseISO(item.date), 'MMM dd')
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      try {
        // Safely handle the date formatting with error checking
        let formattedDate = '';
        if (label && typeof label === 'string') {
          try {
            formattedDate = format(parseISO(label), 'MMM dd, yyyy');
          } catch (error) {
            console.error('Error formatting date:', label, error);
            formattedDate = label; // Fallback to using the raw label
          }
        } else {
          formattedDate = 'Unknown date';
        }

        return (
          <div className="bg-background p-3 border rounded-md shadow-sm">
            <p className="font-medium">{formattedDate}</p>
            <p className="text-insight-500 font-semibold">{`${payload[0].value} queries`}</p>
          </div>
        );
      } catch (error) {
        console.error('Error in tooltip:', error);
        return null;
      }
    }
    return null;
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Query Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
              <Bar dataKey="queries" fill="#9b87f5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueryVolumeChart;
