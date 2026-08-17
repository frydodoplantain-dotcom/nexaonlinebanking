import { useMemo } from 'react';
import * as I from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import Account from '../components/Account';
import Transaction from '../components/Transaction';
import PageIntro from '../components/PageIntro';
import { countries } from '../data/config';
import { generateAccountNumbers } from '../data/config';
import { loadTransactions } from '../utils/data';

export default function Accounts({ user }) {
  const c = countries[user.country];
  const gen = useMemo(() => generateAccountNumbers(user.country), [user.country]);
  const txns = useMemo(() => loadTransactions().filter(t => t.userEmail === user.email).slice(0, 5), [user.email]);

  return (
    <>
      <PageIntro title="Your accounts" text="View balances, details and activity across your NEXA products." />
      <div className="account-grid">
        <Account name="NEXA Checking" num={`•••• ${gen.account?.slice(-4) || '4821'}`} amount={user.balance * 0.5} cur={c.currency} icon={I.WalletCards} main />
        <Account name="NEXA Savings" num={`•••• ${gen.account?.slice(-4) || '7712'}`} amount={user.balance * 0.33} cur={c.currency} icon={I.PiggyBank} />
        <Account name="Fixed Deposit" num={`•••• ${gen.account?.slice(-4) || '3019'}`} amount={user.balance * 0.17} cur={c.currency} icon={I.LockKeyhole} />
      </div>
      <section className="panel">
        <SectionTitle title="Account activity" />
        {txns.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          txns.map(t => (
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
    </>
  );
}
