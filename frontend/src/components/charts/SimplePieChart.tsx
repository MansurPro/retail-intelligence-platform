import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartPalette, chartTheme, tooltipStyle } from './chartTheme';

interface SimplePieChartProps {
  data: unknown[];
  nameKey: string;
  dataKey: string;
}

const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, nameKey, dataKey }) => {
    if (!Array.isArray(data) || data.length === 0) {
        return <p className="text-sm text-slate-400">No data available for chart.</p>;
      }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
        //   label={renderCustomizedLabel} // Optional: Add custom labels
          outerRadius={84}
          fill={chartTheme.cyan}
          dataKey={dataKey}
          nameKey={nameKey} // Tooltip will use this
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={chartPalette[index % chartPalette.length]} stroke="#0f172a" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ paddingTop: 12, color: chartTheme.axis }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SimplePieChart;

// Optional: Example for custom labels if needed
/*
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
*/ 
