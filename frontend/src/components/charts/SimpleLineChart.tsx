import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartTheme, tooltipStyle } from './chartTheme';

interface SimpleLineChartProps {
  data: unknown[];
  xAxisKey: string;
  lineDataKey: string;
  strokeColor?: string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, xAxisKey, lineDataKey, strokeColor = chartTheme.cyan }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-sm text-slate-400">No data available for chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
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
        <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ paddingTop: 12, color: chartTheme.axis }} />
        <Line type="monotone" dataKey={lineDataKey} stroke={strokeColor} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 7 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SimpleLineChart; 
