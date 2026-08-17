export default function Transaction({ icon: Icon, title, date, amount, negative }) {
  return (
    <div className="transaction">
      <span>{Icon && <Icon />}</span>
      <div>
        <strong>{title}</strong>
        <small>{date}</small>
      </div>
      <b className={negative ? 'negative' : ''}>{amount}</b>
    </div>
  );
}
