import { money } from '../utils/money';

export default function Account({ name, num, amount, cur, icon: Icon, main }) {
  return (
    <article className={'account ' + (main ? 'main-account' : '')}>
      <span className="account-icon"><Icon /></span>
      <p>{name}</p>
      <small>{num}</small>
      <h3>{money(amount, cur)}</h3>
      <small>{cur}</small>
    </article>
  );
}
