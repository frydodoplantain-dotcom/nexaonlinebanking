export default function Skeleton({ width = '100%', height = 20, radius = 8 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #f0f2f5 25%, #e4e6eb 50%, #f0f2f5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}
