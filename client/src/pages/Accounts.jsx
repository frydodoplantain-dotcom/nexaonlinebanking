import { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import PageIntro from '../components/PageIntro';
import SectionTitle from '../components/SectionTitle';
import Account from '../components/Account';
import Transaction from '../components/Transaction';
import { accountTypeLabels } from '../data/config';
import { accountLast4, money } from '../utils/money';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

import Button from '../components/Button';
import Field from '../components/Field';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [txns, setTxns] = useState([]);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showFDModal, setShowFDModal] = useState(false);

  const [savingsForm, setSavingsForm] = useState({ amount: '', direction: 'TO_SAVINGS', pin: '' });
  const [fdForm, setFdForm] = useState({ amount: '', durationMonths: '12', pin: '' });

  const { toast } = useToast();

  const loadData = () => {
    api.customer.accounts().then(setAccounts).catch((e) => toast(e.message));
    api.customer.transactions({ limit: '8' }).then((r) => setTxns(r.items || [])).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const checkingAcc = accounts.find((a) => a.type === 'CHECKING');

  const handleSavingsTransfer = async (e) => {
    e.preventDefault();
    if (!savingsForm.amount || Number(savingsForm.amount) <= 0) return toast('Please enter a valid amount.');
    try {
      await api.customer.transferSavings({
        amount: Number(savingsForm.amount),
        direction: savingsForm.direction,
        pin: savingsForm.pin,
      });
      toast('Savings transfer completed.');
      setShowSavingsModal(false);
      setSavingsForm({ amount: '', direction: 'TO_SAVINGS', pin: '' });
      loadData();
    } catch (err) { toast(err.message); }
  };

  const handleBookFD = async (e) => {
    e.preventDefault();
    if (!fdForm.amount || Number(fdForm.amount) <= 0) return toast('Please enter a valid principal amount.');
    try {
      await api.customer.bookFixedDeposit({
        amount: Number(fdForm.amount),
        durationMonths: Number(fdForm.durationMonths),
        pin: fdForm.pin,
      });
      toast('Fixed Deposit created successfully.');
      setShowFDModal(false);
      setFdForm({ amount: '', durationMonths: '12', pin: '' });
      loadData();
    } catch (err) { toast(err.message); }
  };

  const fdRates = { 3: 6.5, 6: 8.5, 12: 11.0, 24: 14.5 };
  const selectedRate = fdRates[fdForm.durationMonths] || 11.0;
  const expectedEst = Number(fdForm.amount || 0) * (1 + (selectedRate / 100) * (Number(fdForm.durationMonths) / 12));

  return (
    <>
      <PageIntro title="Your accounts" text="View balances, manage products, and fund savings or fixed deposits." />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Button onClick={() => setShowSavingsModal(true)}><I.PiggyBank size={18} /> Manage Savings</Button>
        <Button variant="secondary" onClick={() => setShowFDModal(true)}><I.LockKeyhole size={18} /> Book Fixed Deposit</Button>
      </div>

      {showSavingsModal && (
        <div className="modal-backdrop">
          <div className="modal-box card-box" style={{ maxWidth: 460 }}>
            <h3>Transfer to / from Savings Account</h3>
            <form onSubmit={handleSavingsTransfer} style={{ display: 'grid', gap: 12 }}>
              <Field label="Direction" value={savingsForm.direction} onChange={(e) => setSavingsForm({ ...savingsForm, direction: e.target.value })} select>
                <option value="TO_SAVINGS">Checking ➔ Savings Account</option>
                <option value="FROM_SAVINGS">Savings ➔ Checking Account</option>
              </Field>
              <Field label="Amount" type="number" value={savingsForm.amount} onChange={(e) => setSavingsForm({ ...savingsForm, amount: e.target.value })} required />
              <Field label="4-Digit PIN" type="password" maxLength={4} value={savingsForm.pin} onChange={(e) => setSavingsForm({ ...savingsForm, pin: e.target.value })} placeholder="Enter PIN" />
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button type="submit">Confirm Transfer</Button>
                <Button type="button" variant="secondary" onClick={() => setShowSavingsModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFDModal && (
        <div className="modal-backdrop">
          <div className="modal-box card-box" style={{ maxWidth: 520 }}>
            <h3>Open Fixed Deposit Product</h3>
            <form onSubmit={handleBookFD} style={{ display: 'grid', gap: 12 }}>
              <Field label="Deposit Principal Amount" type="number" value={fdForm.amount} onChange={(e) => setFdForm({ ...fdForm, amount: e.target.value })} required />
              <Field label="Investment Duration" value={fdForm.durationMonths} onChange={(e) => setFdForm({ ...fdForm, durationMonths: e.target.value })} select>
                <option value="3">3 Months @ 6.5% p.a.</option>
                <option value="6">6 Months @ 8.5% p.a.</option>
                <option value="12">12 Months @ 11.0% p.a.</option>
                <option value="24">24 Months @ 14.5% p.a.</option>
              </Field>

              {fdForm.amount > 0 && (
                <div style={{ background: '#132247', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <div>Principal: <strong>{money(Number(fdForm.amount), checkingAcc?.currency)}</strong></div>
                  <div>Applicable Yield: <strong>{selectedRate}% p.a.</strong></div>
                  <div>Estimated Maturity Value: <strong style={{ color: 'var(--gold)' }}>{money(expectedEst, checkingAcc?.currency)}</strong></div>
                </div>
              )}

              <Field label="4-Digit PIN" type="password" maxLength={4} value={fdForm.pin} onChange={(e) => setFdForm({ ...fdForm, pin: e.target.value })} placeholder="Enter PIN" />

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button type="submit">Book Fixed Deposit</Button>
                <Button type="button" variant="secondary" onClick={() => setShowFDModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="account-grid">
        {accounts.map((acc) => (
          <Account
            key={acc.id}
            name={accountTypeLabels[acc.type]}
            num={acc.accountNumber}
            amount={acc.balance}
            cur={acc.currency}
            icon={acc.type === 'SAVINGS' ? I.PiggyBank : acc.type === 'FIXED_DEPOSIT' ? I.LockKeyhole : I.WalletCards}
            main={acc.type === 'CHECKING'}
          />
        ))}
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <SectionTitle title="Account activity" />
        {txns.length === 0 ? <p className="muted">No transactions yet.</p> : txns.map((t) => (
          <Transaction
            key={t.id}
            icon={I.ArrowLeftRight}
            title={t.description || t.type}
            date={new Date(t.createdAt).toLocaleString()}
            amount={money(t.amount, t.currency)}
            negative={!['DEPOSIT', 'REFUND', 'INTEREST', 'LOAN_DISBURSEMENT'].includes(t.type)}
          />
        ))}
      </section>
    </>
  );
}
