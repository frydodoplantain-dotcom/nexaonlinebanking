export default function SectionTitle({ title, action }) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      {action && <button>{action} <span className="chevron">›</span></button>}
    </div>
  );
}
