import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import Account from '../components/Account';
import Transaction from '../components/Transaction';
import Logo from '../components/Logo';
import { countries, accountTypeLabels } from '../data/config';
import { money, accountLast4, greeting, formatName } from '../utils/money';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [market, setMarket] = useState([]);
  const [promo, setPromo] = useState(true);
  const nav = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    api.customer.dashboard().then(setData).catch((e) => toast(e.message));
    api.crypto.market().then(setMarket).catch(() => setMarket([]));
  }, []);

  if (!data) return <p className="muted">Loading dashboard…</p>;

  const c = countries[data.user?.profile?.country] || countries.US;
  const checking = data.accounts.find((a) => a.type === 'CHECKING') || data.accounts[0];

  return (
    <>
      <section className="balance" onClick={() => nav('/app/accounts')} style={{ cursor: 'pointer' }}>
        <div>
          <p>Total Balance <button onClick={(e) => { e.stopPropagation(); setHidden(!hidden); }}>{hidden ? <I.EyeOff /> : <I.Eye />}</button></p>
          <h1>{hidden ? '••••••••' : money(data.totalBalance, c.currency)} <small>{c.currency}</small></h1>
          <span>Available Balance {hidden ? '••••••' : money(data.availableBalance, c.currency)}</span>
        </div>
        <div className="n-mark">N</div>
        <div className="gold-slash" />
        <I.ChevronRight className="next" />
      </section>
      <section className="quick">
        {[
          [I.Send, 'Send', 'send', () => nav('/app/transfers')],
          [I.ArrowDownToLine, 'Receive', 'receive', () => nav('/app/receive')],
          [I.Landmark, 'Deposit', 'deposit', () => nav('/app/deposit')],
          [I.ArrowUpFromLine, 'Withdraw', 'withdraw', () => nav('/app/withdraw')],
          [I.MoreHorizontal, 'More', 'more', () => nav('/app/settings')],
        ].map(([Icon, n, cls, f]) => (
          <button key={n} onClick={f}>
            <span className={'qi ' + cls}><Icon size={18} /></span>
            <span>{n}</span>
          </button>
        ))}
      </section>
      <SectionTitle title="My Accounts" action="View All" onAction={() => nav('/app/accounts')} />
      <div className="account-row">
        {data.accounts.length === 0 ? (
          <p className="muted">No accounts yet.</p>
        ) : data.accounts.map((acc) => (
          <Account
            key={acc.id}
            name={accountTypeLabels[acc.type] || acc.type}
            num={`**** ${accountLast4(acc.accountNumber)}`}
            amount={acc.balance}
            cur={acc.currency}
            icon={acc.type === 'SAVINGS' ? I.PiggyBank : acc.type === 'FIXED_DEPOSIT' ? I.LockKeyhole : I.CreditCard}
            main={acc.type === 'CHECKING'}
          />
        ))}
      </div>
      <section className="panel crypto-panel">
        <SectionTitle title="Crypto Market" action="View All" onAction={() => nav('/app/crypto')} />
        {market.length === 0 ? <p className="muted">Market data is currently unavailable.</p> : (
          <div className="crypto-list">
            {market.slice(0, 5).map((coin) => {
              const up = (coin.price_change_percentage_24h || 0) >= 0;
              return (
                <div className="crypto" key={coin.id}>
                  <b className="coin"><img src={coin.image} alt="" /></b>
                  <div><strong>{coin.name}</strong><small>{coin.symbol.toUpperCase()}</small></div>
                  <svg className="spark" viewBox="0 0 70 28" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={up ? '#22c55e' : '#ef4444'}
                      strokeWidth="2"
                      points={(coin.sparkline_in_7d?.price || []).slice(-20).map((p, i, arr) => {
                        const min = Math.min(...arr);
                        const max = Math.max(...arr);
                        const y = max === min ? 14 : 26 - ((p - min) / (max - min)) * 24;
                        return `${(i / (arr.length - 1)) * 70},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                  <strong>${Number(coin.current_price).toLocaleString()}</strong>
                  <em className={up ? '' : 'red'}>{up ? '+' : ''}{Number(coin.price_change_percentage_24h || 0).toFixed(2)}%</em>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {promo && (
        <section className="nexa-card">
          <button className="dismiss" onClick={() => setPromo(false)}><I.X size={16} /></button>
          <div>
            <h3>Get Your Nexa Card</h3>
            <p>Shop online, pay in stores and withdraw worldwide.</p>
            <Button onClick={() => nav('/app/cards')}>Get Started</Button>
            <div className="promo-dots"><i className="on" /><i /><i /></div>
          </div>
          <div className="fake-card">
            <Logo />
            <strong>••••  ••••  ••••  {checking ? accountLast4(checking.accountNumber) : '••••'}</strong>
            <small>{formatName(data.user.profile).toUpperCase()}</small>
          </div>
        </section>
      )}
      <section className="panel" style={{ marginTop: 20 }}>
        <SectionTitle title="Recent activity" action="View All" onAction={() => nav('/app/transactions')} />
        {data.recentTransactions.length === 0 ? <p className="muted">No transactions yet.</p> : data.recentTransactions.map((t) => (
          <Transaction
            key={t.id}
            icon={t.type === 'DEPOSIT' ? I.Download : t.type === 'WITHDRAWAL' ? I.Upload : I.ArrowLeftRight}
            title={t.description || t.type}
            date={new Date(t.createdAt).toLocaleString()}
            amount={(t.type === 'DEPOSIT' || t.type === 'INTEREST' || t.type === 'REFUND' || t.type === 'LOAN_DISBURSEMENT' ? '+' : '-') + money(t.amount, t.currency)}
            negative={!['DEPOSIT', 'INTEREST', 'REFUND', 'LOAN_DISBURSEMENT'].includes(t.type)}
          />
        ))}
      </section>
    </>
  );
}
