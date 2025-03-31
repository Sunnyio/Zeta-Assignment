
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { SearchIcon } from "lucide-react";

interface EmployeeAttendanceProps {
  apiUrl: string;
}

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  department: string;
}

export default function EmployeeAttendance({ apiUrl }: EmployeeAttendanceProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[] | null>(null);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
    if (!employeeId.trim()) {
      toast.error("Please enter an employee ID");
      return;
    }

    try {
      setIsLoading(true);
      setNoDataMessage(null);
      
      const response = await fetch(`${apiUrl}${employeeId}`);
      const data = await response.json();
      
      if (data.message === "No attendance found for employee") {
        setAttendanceData(null);
        setNoDataMessage("No attendance records found for this employee");
        return;
      }
      
      if (data.attendance && Array.isArray(data.attendance)) {
        setAttendanceData(data.attendance);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch attendance data");
      setAttendanceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="employeeId">Employee ID</Label>
          <div className="flex space-x-2">
            <Input
              id="employeeId"
              type="number"
              placeholder="Enter employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />
            <Button 
              onClick={fetchAttendance} 
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? "Loading..." : "Search"} 
              <SearchIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-center">
            <p>Loading attendance records...</p>
          </div>
        </div>
      ) : noDataMessage ? (
        <Card className="bg-muted/50">
          <CardContent className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">{noDataMessage}</p>
          </CardContent>
        </Card>
      ) : attendanceData && attendanceData.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record[2]}</TableCell> {/* Date is at index 2 in the tuple */}
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${record[3] === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                      record[3] === 'Absent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'}`}>
                      {record[3]}
                    </span>
                  </TableCell>
                  <TableCell>{record[4]}</TableCell> {/* Department is at index 4 in the tuple */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
