import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartTheme, tooltipStyle } from './chartTheme';

interface SimpleBarChartProps {
  data: unknown[]; // Use unknown[] instead of any[]
  xAxisKey: string;
  barDataKey: string;
  fillColor?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, xAxisKey, barDataKey, fillColor = chartTheme.cyan }) => {
  // Check if data is an array before proceeding
  if (!Array.isArray(data) || data.length === 0) { 
    return <p className="text-sm text-slate-400">No data available for chart.</p>;
  }

  // Recharts can often handle data with appropriate keys even if type is unknown[]
  // Add more specific checks here if needed for complex scenarios
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data} // Pass unknown[] - Recharts will look for keys
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
        <XAxis dataKey={xAxisKey} tick={{ fill: chartTheme.axis, fontSize: 12 }} axisLine={{ stroke: chartTheme.grid }} tickLine={{ stroke: chartTheme.grid }} />
        <YAxis tick={{ fill: chartTheme.axis, fontSize: 12 }} axisLine={{ stroke: chartTheme.grid }} tickLine={{ stroke: chartTheme.grid }} />
        <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34, 211, 238, 0.08)' }} />
        <Legend wrapperStyle={{ paddingTop: 12, color: chartTheme.axis }} />
        <Bar dataKey={barDataKey} fill={fillColor} radius={[7, 7, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart; 
