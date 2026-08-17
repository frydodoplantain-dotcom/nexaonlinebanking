import { useState, useEffect, useRef } from 'react';

export default function LiveSparkline({
  color = '#f97316',
  gradientId = 'spark-grad-btc',
  initialValues = [30, 65, 40, 75, 50, 85, 55, 90, 70, 95, 60, 100, 75, 95, 80, 110],
  height = 50,
  width = 180,
}) {
  const [points, setPoints] = useState(initialValues);
  const animRef = useRef();
  const phaseRef = useRef(0);

  useEffect(() => {
    let active = true;

    const animateZigzag = () => {
      if (!active) return;
      phaseRef.current += 0.08;
      const phase = phaseRef.current;

      setPoints(() => {
        return initialValues.map((baseVal, idx) => {
          // Keep start anchored, animate inner and end points in sharp zigzag oscillations
          if (idx === 0) return baseVal;
          const shift = Math.sin(phase * 1.5 + idx * 1.1) * 6 + Math.cos(phase * 2.2 + idx * 0.8) * 4;
          const currentVal = baseVal + shift;
          return Math.max(8, Math.min(height - 6, currentVal));
        });
      });

      animRef.current = requestAnimationFrame(animateZigzag);
    };

    animRef.current = requestAnimationFrame(animateZigzag);
    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [initialValues, height]);

  const maxVal = Math.max(...points, 120);
  const stepX = width / (points.length - 1);

  // Map points to (x, y) sharp vertex coordinates
  const coords = points.map((val, i) => {
    const x = i * stepX;
    const y = height - (val / maxVal) * (height - 10) - 5;
    return { x, y };
  });

  // Construct sharp ZIGZAG polyline path string (M x0,y0 L x1,y1 L x2,y2 ...)
  const pathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Closed area path for background gradient fill
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const lastPt = coords[coords.length - 1];

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
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
        <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area Fill Under Sharp Zigzag Line */}
      <path d={areaD} fill={`url(#${gradientId})`} />

      {/* Sharp Glowing Zigzag Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#glow-${gradientId})`}
        className="sparkline-path"
      />

      {/* Live Glowing Leading End Dot */}
      {lastPt && (
        <>
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="6"
            fill={color}
            opacity="0.3"
          />
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="3"
            fill="#ffffff"
            stroke={color}
            strokeWidth="1.5"
          />
        </>
      )}
    </svg>
  );
}
