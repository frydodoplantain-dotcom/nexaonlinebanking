export default function SectionTitle({ title, action, onAction }) {
  return (
    <div className="section-title">
      <h3>{title}</h3>
      {action && <button type="button" onClick={onAction}>{action} <span className="chevron">›</span></button>}
    </div>
  );
}
