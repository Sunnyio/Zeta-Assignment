
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AttendanceForm from "@/components/AttendanceForm";
import AttendanceTrends from "@/components/AttendanceTrends";
import EmployeeAttendance from "@/components/EmployeeAttendance";
import AttendanceInsights from "@/components/AttendanceInsights";
import { UserRound, TrendingUp, CalendarDays, BarChart } from "lucide-react";

const API_BASE_URL = "http://localhost:8000"; // Change to your actual API base URL

const Index = () => {
  const [activeTab, setActiveTab] = useState("record");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold">Attendance Tracker</h1>
          <p className="text-muted-foreground">
            Track, analyze, and manage employee attendance data
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 md:w-[600px]">
            <TabsTrigger value="record" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Record</span>
            </TabsTrigger>
            <TabsTrigger value="employee" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              <span className="hidden md:inline">Employee</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Record Attendance</CardTitle>
                <CardDescription>Add a new attendance record for an employee</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceForm apiUrl={`${API_BASE_URL}/attendance/`} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="employee" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Attendance</CardTitle>
                <CardDescription>View attendance records for a specific employee</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeAttendance apiUrl={`${API_BASE_URL}/attendance/`} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>View attendance trends across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceTrends apiUrl={`${API_BASE_URL}/attendance/trends`} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Get AI-generated insights about attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceInsights apiUrl={`${API_BASE_URL}/insights/`} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
