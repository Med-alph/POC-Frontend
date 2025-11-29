import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useChartData } from '@/hooks/useChartData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

/**
 * Doctor - VitalsTrendChart
 * Shows average heart-rate and BP per day.
 * Expects API response:
 *  { points: [{ date: '2025-11-01', heartRate: 78, systolic: 120, diastolic: 80 }, ...] }
 */
const VitalsTrendChart = ({ userId }) => {
  const { data, loading, error } = useChartData('/charts/doctor/vitals-trend', {
    socketEvent: 'chart:update',
    socketRoom: 'doctor:vitals-trend',
    userId,
  });

  const chartData = useMemo(() => {
    const points = data?.points || [];
    const labels = points.map((p) => p.date);

    return {
      labels,
      datasets: [
        {
          label: 'Heart Rate (bpm)',
          data: points.map((p) => p.heartRate),
          borderColor: 'rgba(239, 68, 68, 1)', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          yAxisID: 'y',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Systolic BP (mmHg)',
          data: points.map((p) => p.systolic),
          borderColor: 'rgba(34, 197, 94, 1)', // green-500
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          yAxisID: 'y1',
          tension: 0.3,
          fill: false,
        },
        {
          label: 'Diastolic BP (mmHg)',
          data: points.map((p) => p.diastolic),
          borderColor: 'rgba(59, 130, 246, 1)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          yAxisID: 'y1',
          tension: 0.3,
          fill: false,
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
        title: {
          display: false,
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
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Heart Rate (bpm)',
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Blood Pressure (mmHg)',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Vitals Trend (Daily Averages)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading && <div className="text-sm text-muted-foreground">Loading chart...</div>}
        {error && (
          <div className="text-sm text-red-500">
            Failed to load chart data
          </div>
        )}
        {!loading && !error && (
          <Line options={options} data={chartData} />
        )}
      </CardContent>
    </Card>
  );
};

export default VitalsTrendChart;



