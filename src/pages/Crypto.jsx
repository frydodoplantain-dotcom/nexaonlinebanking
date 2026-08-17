import { useState } from 'react';
import * as I from 'lucide-react';
import PageIntro from '../components/PageIntro';
import SectionTitle from '../components/SectionTitle';
import CryptoList from '../components/CryptoList';

const periods = ['1H', '1D', '1W', '1M', '1Y'];

export default function Crypto() {
  const [period, setPeriod] = useState('1D');

  return (
    <>
      <PageIntro title="Crypto market" text="Market data is for informational purposes only and not trading advice." />
      <div className="market-hero">
        <div>
          <p>Bitcoin <span>BTC</span></p>
          <h1>$66,432.50</h1>
          <strong>+2.35% (24h)</strong>
          <div className="market-stats">
            <div><small>Market Cap</small><b>$1.2T</b></div>
            <div><small>Volume (24h)</small><b>$28.5B</b></div>
            <div><small>Circulating Supply</small><b>19.6M BTC</b></div>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart-tabs">
            {periods.map(p => (
              <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <div className="chart">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>
      </div>
      <section className="panel">
        <SectionTitle title="Top assets" />
        <CryptoList />
      </section>
    </>
  );
}
