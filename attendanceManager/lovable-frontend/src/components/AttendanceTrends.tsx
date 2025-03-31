
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw } from "lucide-react";

interface AttendanceTrendsProps {
  apiUrl: string;
}

interface TrendData {
  name: string;
  Present: number;
  Absent: number;
  WFH: number;
}

export default function AttendanceTrends({ apiUrl }: AttendanceTrendsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState<TrendData[]>([]);

  const fetchTrends = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Failed to fetch attendance trends");
      }
      
      const data = await response.json();
      
      // Process data for chart visualization
      if (data.attendance_trends) {
        const departmentTrends: { [key: string]: TrendData } = {};
        
        // Group by department
        Object.values(data.attendance_trends).forEach((entry: any) => {
          const department = entry.department;
          if (!departmentTrends[department]) {
            departmentTrends[department] = {
              name: department,
              Present: 0,
              Absent: 0,
              WFH: 0
            };
          }
          
          // Add up the counts
          if (entry.attendance.Present) {
            departmentTrends[department].Present += entry.attendance.Present;
          }
          if (entry.attendance.Absent) {
            departmentTrends[department].Absent += entry.attendance.Absent;
          }
          if (entry.attendance.WFH) {
            departmentTrends[department].WFH += entry.attendance.WFH;
          }
        });
        
        setTrends(Object.values(departmentTrends));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch attendance trends");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [apiUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-center">
          <p>Loading attendance trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={fetchTrends} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Trends
        </Button>
      </div>
      
      {trends.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">No attendance trends available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trends}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }} 
              />
              <Legend />
              <Bar dataKey="Present" fill="#10b981" name="Present" />
              <Bar dataKey="Absent" fill="#ef4444" name="Absent" />
              <Bar dataKey="WFH" fill="#3b82f6" name="WFH" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
