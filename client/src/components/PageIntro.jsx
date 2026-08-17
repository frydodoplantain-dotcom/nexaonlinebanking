export default function PageIntro({ title, text, action, onAction }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action && <button className="btn" onClick={onAction}>{action}</button>}
    </div>
  );
}
