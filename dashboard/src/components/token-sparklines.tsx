"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = "#e63946",
  width = 60,
  height = 20,
}: SparklineProps) {
  if (data.length < 2) {
    // Flat line for insufficient data
    const y = height / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <line
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.5}
        />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 1;
  const drawHeight = height - padding * 2;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = padding + drawHeight - ((v - min) / range) * drawHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  // Build closed polygon for fill area (line + bottom edge)
  const firstX = 0;
  const lastX = ((data.length - 1) * stepX).toFixed(2);
  const fillPoints = `${points} ${lastX},${height} ${firstX},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      <polygon
        points={fillPoints}
        fill={color}
        fillOpacity={0.1}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SparklineCellProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SparklineCell({
  data,
  color,
  width = 60,
  height = 20,
  className,
}: SparklineCellProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        className
      )}
    >
      <Sparkline data={data} color={color} width={width} height={height} />
    </div>
  );
}
