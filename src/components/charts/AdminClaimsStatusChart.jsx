import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useChartData } from '@/hooks/useChartData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

/**
 * Admin - AdminClaimsStatusChart
 * Expects API response:
 *  { statuses: [{ status: 'Approved', count: 120 }, ...] }
 */
const AdminClaimsStatusChart = ({ userId }) => {
  const { data, loading, error } = useChartData('/charts/admin/claims-status', {
    socketEvent: 'chart:update',
    socketRoom: 'admin:claims-status',
    userId,
  });

  const chartData = useMemo(() => {
    const statuses = data?.statuses || [];
    return {
      labels: statuses.map((s) => s.status),
      datasets: [
        {
          label: 'Claims',
          data: statuses.map((s) => s.count),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)', // Approved - green
            'rgba(59, 130, 246, 0.8)', // Pending - blue
            'rgba(239, 68, 68, 0.8)', // Rejected - red
            'rgba(148, 163, 184, 0.8)', // Other - slate
          ],
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Status',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Claims',
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Claims by Status</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading && <div className="text-sm text-muted-foreground">Loading chart...</div>}
        {error && (
          <div className="text-sm text-red-500">
            Failed to load chart data
          </div>
        )}
        {!loading && !error && (
          <Bar options={options} data={chartData} />
        )}
      </CardContent>
    </Card>
  );
};

export default AdminClaimsStatusChart;



