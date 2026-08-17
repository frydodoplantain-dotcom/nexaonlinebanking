import { useMemo } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import Account from '../components/Account';
import Transaction from '../components/Transaction';
import CryptoList from '../components/CryptoList';
import { countries } from '../data/config';
import { money } from '../utils/money';
import { generateAccountNumbers } from '../data/config';
import { loadTransactions } from '../utils/data';

export default function Dashboard({ user, hidden, setHidden, go }) {
  const c = countries[user.country];
  const accounts = useMemo(() => {
    const gen = generateAccountNumbers(user.country);
    return [
      { name: 'NEXA Checking', num: `•••• ${gen.account?.slice(-4) || '4821'}`, amount: user.balance * 0.5, cur: c.currency, icon: I.WalletCards, main: true },
      { name: 'NEXA Savings', num: `•••• ${gen.account?.slice(-4) || '7712'}`, amount: user.balance * 0.33, cur: c.currency, icon: I.PiggyBank },
      { name: 'Fixed Deposit', num: `•••• ${gen.account?.slice(-4) || '3019'}`, amount: user.balance * 0.17, cur: c.currency, icon: I.LockKeyhole },
    ];
  }, [user.balance, user.country, c.currency]);

  const recentTxns = useMemo(() => {
    return loadTransactions()
      .filter(t => t.userEmail === user.email)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [user.email]);

  return (
    <>
      <section className="balance">
        <div>
          <p>Total balance <button onClick={() => setHidden(!hidden)}>{hidden ? <I.EyeOff /> : <I.Eye />}</button></p>
          <h1>{hidden ? '••••••••' : money(user.balance, c.currency)} <small>{c.currency}</small></h1>
          <span>Available balance</span>
          <strong>{hidden ? '••••••' : money(user.available, c.currency)}</strong>
        </div>
        <div className="n-mark">N</div>
        <I.ChevronRight className="next" />
      </section>
      <section className="quick">
        {[
          [I.Send, 'Send', () => go('transfers')],
          [I.Download, 'Receive'],
          [I.BadgePlus, 'Deposit'],
          [I.Upload, 'Withdraw'],
          [I.MoreHorizontal, 'More'],
        ].map(([Icon, n, f]) => (
          <button key={n} onClick={f}>
            <Icon />
            <span>{n}</span>
          </button>
        ))}
      </section>
      <SectionTitle title="My accounts" action="View all" />
      <div className="account-row">
        {accounts.map((acc, i) => (
          <Account key={i} {...acc} />
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel crypto-panel">
          <SectionTitle title="Crypto market" action="View all" />
          <CryptoList limit={5} />
        </section>
        <section className="panel activity">
          <SectionTitle title="Recent activity" action="View all" />
          {recentTxns.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            recentTxns.map(t => (
              <Transaction
                key={t.id}
                icon={t.type === 'Deposit' ? I.Download : t.type === 'Withdrawal' ? I.Upload : I.ArrowLeftRight}
                title={t.title}
                date={new Date(t.date).toLocaleString()}
                amount={t.amount}
                negative={t.rawAmount < 0}
              />
            ))
          )}
        </section>
      </div>
      <section className="nexa-card">
        <div>
          <h3>Your NEXA card</h3>
          <p>Shop online, pay in stores and withdraw worldwide.</p>
          <Button onClick={() => go('cards')}>Manage cards</Button>
        </div>
        <div className="fake-card">
          <Logo />
          <strong>••••  ••••  ••••  ••••</strong>
          <small>{user.name.toUpperCase()}  08/30</small>
        </div>
      </section>
    </>
  );
}
