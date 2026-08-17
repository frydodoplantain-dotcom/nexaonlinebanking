import { useEffect, useState } from 'react';
import PageIntro from '../components/PageIntro';
import { money } from '../utils/money';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Transactions() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [status, setStatus] = useState('ALL');
  const { toast } = useToast();
  useEffect(() => {
    api.customer.transactions({ status, page: '1', limit: '50' }).then(setData).catch((e) => toast(e.message));
  }, [status]);
  return (
    <>
      <PageIntro title="Transactions" text="Your complete transaction history." />
      <section className="panel">
        <div className="filter-bar">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        {data.items.length === 0 ? <p className="muted">No transactions found.</p> : data.items.map((t) => (
          <div key={t.id} className="transaction-row">
            <div>
              <strong>{t.description || t.type}</strong>
              <small>{t.reference} · {new Date(t.createdAt).toLocaleString()} · {t.status}</small>
            </div>
            <b className={['DEPOSIT', 'REFUND', 'INTEREST', 'LOAN_DISBURSEMENT'].includes(t.type) ? 'positive' : 'negative'}>
              {money(t.amount, t.currency)}
            </b>
          </div>
        ))}
      </section>
    </>
  );
}
