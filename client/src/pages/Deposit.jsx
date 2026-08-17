import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Deposit() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ accountId: '', amount: '', senderName: '', senderBank: '', reference: '', message: '' });
  const { toast } = useToast();
  useEffect(() => {
    api.customer.accounts().then((a) => { setAccounts(a); if (a[0]) setForm((f) => ({ ...f, accountId: a[0].id })); });
  }, []);

  const submit = async () => {
    try {
      await api.support.create({
        subject: `Deposit request · ${form.amount}`,
        message: `Please credit account ${form.accountId} with ${form.amount}. Sender: ${form.senderName} (${form.senderBank}). Ref: ${form.reference}. ${form.message}`,
        priority: 'MEDIUM',
      });
      toast('Deposit request submitted. NEXA will review and credit your account.');
      setForm({ ...form, amount: '', senderName: '', senderBank: '', reference: '', message: '' });
    } catch (e) { toast(e.message); }
  };

  return (
    <>
      <PageIntro title="Deposit" text="Submit a deposit request. Funds are credited after NEXA verification." />
      <section className="panel">
        <Field label="Account" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} select>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} · {a.currency}</option>)}
        </Field>
        <Field label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <Field label="Sender name" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
        <Field label="Sender bank" value={form.senderBank} onChange={(e) => setForm({ ...form, senderBank: e.target.value })} />
        <Field label="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        <Button onClick={submit}>Submit deposit request</Button>
      </section>
    </>
  );
}
