import { useTheme } from 'next-themes';
import React from 'react';

export default function CharacterCounter({ castLength }: { castLength: number }) {
  const maxLength = 1024;
  const percentage = Math.min((castLength / maxLength) * 100, 100);
  const strokeDasharray = 2 * Math.PI * 18; // Circumference of the circle
  const strokeDashoffset = strokeDasharray * ((100 - percentage) / 100);

  const { resolvedTheme } = useTheme();

  return (
    <div className="flex items-center scale-[75%] h-9">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={resolvedTheme === 'dark' ? '#4b5563' : '#e5e7eb'}
          strokeWidth="4"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={castLength > maxLength ? '#ef4444' : castLength > 0.9 * maxLength ? '#f59e0b' : resolvedTheme === 'dark' ? '#fff' : '#4b5563'}
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 20 20)"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-xs font-medium"
          fill={castLength > maxLength ? '#ef4444' : castLength > 0.9 * maxLength ? '#f59e0b' : resolvedTheme === 'dark' ? '#fff' : '#4b5563'}
        >
          {castLength}
        </text>
      </svg>
    </div>
  );
}
