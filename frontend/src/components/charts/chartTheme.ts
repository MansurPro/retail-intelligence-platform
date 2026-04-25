export const chartTheme = {
  cyan: "#22d3ee",
  blue: "#60a5fa",
  indigo: "#818cf8",
  purple: "#a78bfa",
  green: "#34d399",
  amber: "#fbbf24",
  pink: "#f472b6",
  axis: "#b6c7dc",
  grid: "rgba(148, 163, 184, 0.18)",
  tooltipBg: "rgba(15, 23, 42, 0.96)",
  tooltipBorder: "rgba(103, 232, 249, 0.32)",
};

export const chartPalette = [
  chartTheme.cyan,
  chartTheme.blue,
  chartTheme.indigo,
  chartTheme.purple,
  chartTheme.green,
  chartTheme.amber,
  chartTheme.pink,
];

export const tooltipStyle = {
  backgroundColor: chartTheme.tooltipBg,
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: 12,
  color: "#e5eef8",
  boxShadow: "0 14px 34px rgba(2, 6, 23, 0.42)",
};
