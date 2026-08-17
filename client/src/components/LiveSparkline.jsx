import { useState, useEffect, useRef } from 'react';

export default function LiveSparkline({
  color = '#f97316',
  gradientId = 'spark-grad-btc',
  initialValues = [40, 48, 42, 55, 50, 62, 58, 70, 65, 82, 78, 90, 85, 95],
  height = 50,
  width = 180,
}) {
  const [points, setPoints] = useState(initialValues);
  const animRef = useRef();
  const phaseRef = useRef(0);

  useEffect(() => {
    let active = true;

    const updatePoints = () => {
      if (!active) return;
      phaseRef.current += 0.05;
      const phase = phaseRef.current;

      setPoints((prev) => {
        return prev.map((val, idx) => {
          // Keep first and last anchored, apply wave micro-fluctuations to inner points
          if (idx === 0) return val;
          const noise = Math.sin(phase + idx * 0.7) * 1.5 + Math.cos(phase * 1.3 + idx) * 1.2;
          const base = initialValues[idx] || val;
          const newVal = base + noise;
          return Math.max(10, Math.min(height - 5, newVal));
        });
      });

      animRef.current = requestAnimationFrame(updatePoints);
    };

    animRef.current = requestAnimationFrame(updatePoints);
    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [initialValues, height]);

  // Generate SVG path string (smooth Bezier curve)
  const minVal = 0;
  const maxVal = 100;
  const stepX = width / (points.length - 1);

  const coords = points.map((val, i) => {
    const x = i * stepX;
    const y = height - (val / maxVal) * (height - 8) - 4;
    return { x, y };
  });

  // Create smooth Bezier cubic curve path
  let pathD = `M ${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Gradient Area Fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Glowing Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${gradientId})`}
        className="sparkline-path"
      />

      {/* Live Pulsing End Dot */}
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="3.5"
          fill={color}
          className="sparkline-dot"
        />
      )}
    </svg>
  );
}
