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
 * Admin - AdminDailyVolumeChart
 * Expects API response:
 *  { points: [{ date: '2025-11-01', count: 120 }, ...] }
 */
const AdminDailyVolumeChart = ({ userId }) => {
  const { data, loading, error } = useChartData('/charts/admin/daily-volume', {
    socketEvent: 'chart:update',
    socketRoom: 'admin:daily-volume',
    userId,
  });

  const chartData = useMemo(() => {
    const points = data?.points || [];
    return {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: 'Appointments per day',
          data: points.map((p) => p.count),
          backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500
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
            text: 'Date',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Volume',
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
        <CardTitle>Daily Appointment Volume</CardTitle>
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

export default AdminDailyVolumeChart;





