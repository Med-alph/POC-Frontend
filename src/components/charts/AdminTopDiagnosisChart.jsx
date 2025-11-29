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
 * Admin - AdminTopDiagnosisChart
 * Expects API response:
 *  { items: [{ diagnosis: 'Hypertension', count: 42 }, ...] }
 */
const AdminTopDiagnosisChart = ({ userId }) => {
  const { data, loading, error } = useChartData('/charts/admin/top-diagnosis', {
    socketEvent: 'chart:update',
    socketRoom: 'admin:top-diagnosis',
    userId,
  });

  const chartData = useMemo(() => {
    const items = data?.items || [];
    return {
      labels: items.map((i) => i.diagnosis),
      datasets: [
        {
          label: 'Cases',
          data: items.map((i) => i.count),
          backgroundColor: 'rgba(234, 179, 8, 0.8)', // yellow-500
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      indexAxis: 'y',
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
            text: 'Cases',
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: 'Diagnosis',
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Diagnoses</CardTitle>
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

export default AdminTopDiagnosisChart;



