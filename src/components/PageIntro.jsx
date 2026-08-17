import Button from './Button';
import * as I from 'lucide-react';

export default function PageIntro({ title, text }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <Button><I.Plus /> New {title === 'Loans' ? 'application' : 'item'}</Button>
    </div>
  );
}
