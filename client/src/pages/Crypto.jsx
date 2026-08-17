import { useEffect, useState } from 'react';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Crypto() {
  const [market, setMarket] = useState([]);
  const { toast } = useToast();
  useEffect(() => { api.crypto.market().then(setMarket).catch((e) => toast(e.message)); }, []);
  const top = market[0];
  return (
    <>
      <PageIntro title="Crypto market" text="Market data is for informational purposes only and not trading advice." />
      {top && (
        <div className="market-hero">
          <div>
            <p>{top.name} <span>{top.symbol?.toUpperCase()}</span></p>
            <h1>${Number(top.current_price).toLocaleString()}</h1>
            <strong>{Number(top.price_change_percentage_24h || 0).toFixed(2)}% (24h)</strong>
          </div>
        </div>
      )}
      <section className="panel" style={{ marginTop: 16 }}>
        {market.length === 0 ? <p className="muted">Unable to load market data.</p> : market.map((coin) => {
          const up = (coin.price_change_percentage_24h || 0) >= 0;
          return (
            <div className="crypto" key={coin.id}>
              <b className="coin"><img src={coin.image} alt="" /></b>
              <div><strong>{coin.name}</strong><small>{coin.symbol.toUpperCase()}</small></div>
              <strong>${Number(coin.current_price).toLocaleString()}</strong>
              <em className={up ? '' : 'red'}>{up ? '+' : ''}{Number(coin.price_change_percentage_24h || 0).toFixed(2)}%</em>
            </div>
          );
        })}
      </section>
    </>
  );
}
