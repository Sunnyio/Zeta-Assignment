
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart3, Clock, DownloadCloud, FileCheck2, PieChart } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';
import api from '@/services/api';
import StatCard from '@/components/dashboard/StatCard';

const COLORS = ['#8b5cf6', '#9b87f5', '#7E69AB', '#6E59A5', '#D6BCFA'];

// Custom Active Shape for Pie Chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} queries`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7');
  const [activeTab, setActiveTab] = useState('overview');
  const [activePieSlice, setActivePieSlice] = useState(0);

  // Get query statistics
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['queryStats'],
    queryFn: api.getQueryStats,
  });

  // Get performance metrics based on selected time range
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['performance', timeRange],
    queryFn: () => api.getPerformanceMetrics(parseInt(timeRange)),
  });

  // Format data for top sources chart
  const topSourcesData = statsData?.top_sources
    ? statsData.top_sources.slice(0, 5).map(item => ({
        name: item.source,
        value: item.count,
      }))
    : [];

  // Format queries per day data for bar chart
  const queriesPerDayData = statsData?.queries_per_day
    ? Object.entries(statsData.queries_per_day)
        .map(([date, count]) => ({
          date,
          queries: count,
          dateFormatted: format(parseISO(date), 'MMM dd'),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Format performance data for line chart
  const performanceChartData = performanceData
    ? performanceData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(item => ({
          date: item.date,
          dateFormatted: format(parseISO(item.date), 'MMM dd'),
          successRate: Number((item.success_rate * 100).toFixed(1)),
          latency: Number(item.avg_latency.toFixed(2)),
          volume: item.query_volume,
        }))
    : [];

  const handleDownloadCSV = () => {
    if (!statsData || !performanceData) return;
    
    // Create CSV content
    const headers = "Date,Query Volume,Success Rate,Average Latency\n";
    const rows = performanceData
      .map(item => {
        return `${item.date},${item.query_volume},${(item.success_rate * 100).toFixed(1)}%,${item.avg_latency.toFixed(2)}s`;
      })
      .join("\n");
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    const encodedUri = encodeURI(csvContent);
    
    // Create a link and trigger download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `insight-latency-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Detailed analytics and insights from your knowledge base usage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadCSV}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Queries"
                value={statsData?.total_queries || 0}
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <StatCard
                title="Success Rate"
                value={statsData?.success_rate !== undefined ? `${(statsData.success_rate * 100).toFixed(1)}%` : '--'}
                icon={<FileCheck2 className="h-4 w-4" />}
              />
              <StatCard
                title="Avg Response Time"
                value={statsData?.avg_response_time !== undefined ? `${statsData.avg_response_time.toFixed(2)}s` : '--'}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatCard
                title="Documents Used"
                value={topSourcesData.length}
                icon={<PieChart className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Query Volume Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateFormatted" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [`${value}`, name === "volume" ? "Queries" : name]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#8b5cf6" 
                          strokeWidth={2} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          activeIndex={activePieSlice}
                          activeShape={renderActiveShape}
                          data={topSourcesData}
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={(_, index) => setActivePieSlice(index)}
                        >
                          {topSourcesData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="queries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Queries Per Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={queriesPerDayData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="dateFormatted" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} queries`, "Volume"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="queries" fill="#9b87f5" name="Queries" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Queries</CardTitle>
                <CardDescription>Most frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3">Query</th>
                      <th className="pb-3 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {statsData?.top_queries?.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="py-3">
                          <div className="font-medium truncate max-w-md" title={item.query}>
                            {item.query}
                          </div>
                        </td>
                        <td className="py-3 text-right">{item.count}</td>
                      </tr>
                    ))}
                    {(!statsData?.top_queries || statsData.top_queries.length === 0) && (
                      <tr>
                        <td colSpan={2} className="py-6 text-center text-muted-foreground">
                          No query data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateFormatted" />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Success Rate"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="successRate" 
                          stroke="#22c55e" 
                          strokeWidth={2} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Response Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateFormatted" />
                        <YAxis
                          tickFormatter={(value) => `${value}s`}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}s`, "Avg. Latency"]}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="latency" 
                          stroke="#9b87f5" 
                          strokeWidth={2} 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed daily performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Query Volume</th>
                      <th className="pb-3">Success Rate</th>
                      <th className="pb-3">Avg. Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {performanceData?.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 font-medium">
                          {format(parseISO(item.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3">{item.query_volume} queries</td>
                        <td className="py-3">{(item.success_rate * 100).toFixed(1)}%</td>
                        <td className="py-3">{item.avg_latency.toFixed(2)}s</td>
                      </tr>
                    ))}
                    {(!performanceData || performanceData.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No performance data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={topSourcesData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        fill="#8884d8"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {topSourcesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} queries`, "Queries"]} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Document Usage</CardTitle>
                <CardDescription>How frequently each document is used in queries</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="pb-3">Document</th>
                      <th className="pb-3 text-right">Query Count</th>
                      <th className="pb-3 text-right">Usage %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {statsData?.top_sources?.map((item, index) => {
                      const percentage = statsData.total_queries 
                        ? ((item.count / statsData.total_queries) * 100).toFixed(1) 
                        : "0";
                      
                      return (
                        <tr key={index}>
                          <td className="py-3 font-medium">{item.source}</td>
                          <td className="py-3 text-right">{item.count}</td>
                          <td className="py-3 text-right">{percentage}%</td>
                        </tr>
                      );
                    })}
                    {(!statsData?.top_sources || statsData.top_sources.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-muted-foreground">
                          No document usage data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Analytics;
