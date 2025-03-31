
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, FileCheck2, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import StatCard from '@/components/dashboard/StatCard';
import QueryVolumeChart from '@/components/dashboard/QueryVolumeChart';
import PerformanceLineChart from '@/components/dashboard/PerformanceLineChart';
import TopItemsList from '@/components/dashboard/TopItemsList';
import api from '@/services/api';

const Dashboard: React.FC = () => {
  // Get performance metrics for the last 7 days
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['performance'],
    queryFn: () => api.getPerformanceMetrics(7),
  });

  // Get query statistics
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['queryStats'],
    queryFn: api.getQueryStats,
  });

  // Format data for top sources widget
  const topSources = statsData?.top_sources?.map(item => ({
    name: item.source,
    value: item.count
  })) || [];

  // Format data for top queries widget
  const topQueries = statsData?.top_queries?.map(item => ({
    name: item.query,
    value: item.count
  })) || [];

  // Calculate success rate percentage
  const successRate = statsData?.success_rate !== undefined 
    ? `${(statsData.success_rate * 100).toFixed(1)}%` 
    : '--';

  // Format average response time
  const avgResponseTime = statsData?.avg_response_time !== undefined
    ? `${statsData.avg_response_time.toFixed(2)}s`
    : '--';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Analytics and metrics for your AI knowledge base.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Queries"
            value={statsData?.total_queries || 0}
            icon={<Search className="h-4 w-4" />}
          />
          <StatCard
            title="Success Rate"
            value={successRate}
            icon={<FileCheck2 className="h-4 w-4" />}
          />
          <StatCard
            title="Avg Response Time"
            value={avgResponseTime}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title="Queries Today"
            value={performanceData?.[0]?.query_volume || 0}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {!isPerformanceLoading && performanceData && (
            <QueryVolumeChart data={performanceData} />
          )}
          
          <div className="col-span-1 lg:col-span-2">
            {!isPerformanceLoading && performanceData && (
              <PerformanceLineChart 
                title="Performance Metrics"
                data={performanceData}
                lines={[
                  { key: "success_rate", color: "#22c55e", name: "Success Rate", formatter: (v) => `${(v * 100).toFixed(1)}%` },
                  { key: "avg_latency", color: "#9b87f5", name: "Avg. Latency", formatter: (v) => `${v.toFixed(2)}s` }
                ]}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopItemsList 
            title="Top Queried Documents"
            items={topSources}
            valueFormatter={(value) => `${value} queries`}
            emptyMessage="No documents have been queried yet"
          />
          <TopItemsList 
            title="Top Questions"
            items={topQueries}
            valueFormatter={(value) => `${value} times`}
            emptyMessage="No questions have been asked yet"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
