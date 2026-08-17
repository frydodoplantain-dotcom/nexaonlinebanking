import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

import { COUNTRY_BANKS } from '../data/banks';

export default function Withdraw() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    fromAccountId: '', amount: '', recipientName: '', bankName: '', accountNumber: '',
    country: 'US', routing: '', sortCode: '', bsb: '', pin: '', purpose: 'Withdrawal',
  });
  const { toast } = useToast();

  useEffect(() => {
    api.customer.accounts().then((a) => {
      setAccounts(a);
      if (a[0]) setForm((f) => ({ ...f, fromAccountId: a[0].id }));
    });
  }, []);

  const countryConfig = COUNTRY_BANKS[form.country] || COUNTRY_BANKS.US;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast('Please enter a valid amount.');
    if (!form.recipientName || !form.accountNumber) return toast('Please fill in recipient details.');

    try {
      await api.transfers.external({
        fromAccountId: form.fromAccountId,
        amount: Number(form.amount),
        recipientName: form.recipientName,
        bankName: form.bankName || 'External withdrawal',
        accountNumber: form.accountNumber,
        country: form.country,
        routing: form.routing,
        sortCode: form.sortCode,
        bsb: form.bsb,
        purpose: form.purpose,
        pin: form.pin,
      });
      toast('Withdrawal request submitted for review.');
      setForm((f) => ({ ...f, amount: '', pin: '' }));
    } catch (err) { toast(err.message); }
  };

  return (
    <>
      <PageIntro title="Withdraw" text="Submit an external bank withdrawal request. Tracks request status under your transactions." />
      <section className="panel" style={{ maxWidth: 640 }}>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <Field label="From Account" value={form.fromAccountId} onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })} select>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} · {a.currency} (Bal: {a.balance})</option>)}
          </Field>

          <Field label="Amount to Withdraw" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />

          <Field label="Destination Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, bankName: '' })} select>
            {Object.values(COUNTRY_BANKS).map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.flag} {c.countryName} ({c.currency})
              </option>
            ))}
          </Field>

          <Field label="Select Destination Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} select>
            <option value="">-- Choose {countryConfig.countryName} Bank --</option>
            {countryConfig.banks.map((b) => (
              <option key={b.code} value={b.name}>{b.name}</option>
            ))}
            <option value="Other Bank">Other / Unlisted Bank</option>
          </Field>

          <Field label="Account Holder Name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
          <Field label="Account Number / IBAN" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required />

          {countryConfig.requiredFields.includes('routing') && (
            <Field label="Routing Number (ABA)" value={form.routing} onChange={(e) => setForm({ ...form, routing: e.target.value })} />
          )}
          {countryConfig.requiredFields.includes('sortCode') && (
            <Field label="Sort Code (6 Digits)" value={form.sortCode} onChange={(e) => setForm({ ...form, sortCode: e.target.value })} />
          )}
          {countryConfig.requiredFields.includes('bsb') && (
            <Field label="BSB Number (6 Digits)" value={form.bsb} onChange={(e) => setForm({ ...form, bsb: e.target.value })} />
          )}

          <Field label="4-Digit PIN" type="password" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="Confirm with PIN" />

          <Button type="submit" style={{ marginTop: 8 }}>Submit Withdrawal Request</Button>
        </form>
      </section>
    </>
  );
}
