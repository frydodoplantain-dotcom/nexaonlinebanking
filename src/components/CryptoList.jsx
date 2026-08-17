import * as I from 'lucide-react';
import { cryptos } from '../data/config';

export default function CryptoList({ limit = 6 }) {
  return (
    <div className="crypto-list">
      {cryptos.slice(0, limit).map(([mark, name, sym, price, change]) => (
        <div className="crypto" key={sym}>
          <b className={'coin ' + (change[0] === '-' ? 'red' : '')}>{mark}</b>
          <div>
            <strong>{name}</strong>
            <small>{sym}</small>
          </div>
          <i className={change[0] === '-' ? 'down' : ''}>〰〰╱〰╱</i>
          <strong>${price}</strong>
          <em className={change[0] === '-' ? 'red' : ''}>{change}</em>
        </div>
      ))}
    </div>
  );
}
