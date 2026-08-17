import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';
import { COUNTRY_BANKS } from '../data/banks';
import { money } from '../utils/money';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Transfer() {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    type: 'internal', fromAccountId: '', q: '', recipientUserId: '', toAccountId: '',
    amount: '', purpose: '', pin: '', recipientName: '', bankName: '', bankCode: '', accountNumber: '',
    country: 'US', swift: '', iban: '', routing: '', sortCode: '', bsb: '', transit: '', institution: '', address: '',
  });
  const [recipient, setRecipient] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { toast } = useToast();
  const nav = useNavigate();
  
  const countryConfig = COUNTRY_BANKS[form.country] || COUNTRY_BANKS.US;
  const from = accounts.find((a) => a.id === form.fromAccountId) || accounts[0];

  useEffect(() => {
    api.customer.accounts().then((a) => {
      setAccounts(a);
      if (a[0]) setForm((f) => ({ ...f, fromAccountId: f.fromAccountId || a[0].id }));
    }).catch((e) => toast(e.message));
  }, []);

  const lookup = async () => {
    try {
      const r = await api.transfers.lookup(form.q);
      setRecipient(r);
      setForm((f) => ({ ...f, recipientUserId: r.id, toAccountId: r.accounts[0]?.id || '' }));
    } catch (e) {
      setRecipient(null);
      toast(e.message);
    }
  };

  const complete = async () => {
    try {
      if (form.type === 'internal') {
        const rec = await api.transfers.internal({
          fromAccountId: form.fromAccountId,
          toAccountId: form.toAccountId,
          recipientUserId: form.recipientUserId,
          amount: Number(form.amount),
          purpose: form.purpose,
          pin: form.pin,
        });
        setReceipt(rec);
      } else {
        const rec = await api.transfers.external({
          fromAccountId: form.fromAccountId,
          amount: Number(form.amount),
          recipientName: form.recipientName,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          country: form.country,
          swift: form.swift, iban: form.iban, routing: form.routing, sortCode: form.sortCode, bsb: form.bsb,
          address: form.address, purpose: form.purpose, pin: form.pin,
        });
        setReceipt({ ...rec, amount: Number(form.amount), currency: from?.currency, senderAccount: from?.accountNumber, recipient: form.recipientName, recipientAccount: form.accountNumber, fee: 0, total: Number(form.amount), date: new Date().toISOString() });
      }
      toast(form.type === 'internal' ? 'Transfer completed.' : 'External transfer submitted for review.');
    } catch (e) {
      toast(e.message);
    }
  };

  const printReceipt = () => {
    const w = window.open('', '_blank');
    if (!w || !receipt) return;
    w.document.write(`<html><head><title>${receipt.reference}</title><style>body{font-family:Arial;max-width:600px;margin:40px auto}h1{color:#061b47}table{width:100%}td{padding:8px;border-bottom:1px solid #eee}</style></head><body>`);
    w.document.write(`<h1>NEXA Microfinance Bank</h1><p>Transaction Receipt</p><table>
      <tr><td>Reference</td><td>${receipt.reference}</td></tr>
      <tr><td>Status</td><td>${receipt.status}</td></tr>
      <tr><td>Sender</td><td>${receipt.sender || ''}</td></tr>
      <tr><td>Sender account</td><td>${receipt.senderAccount || ''}</td></tr>
      <tr><td>Recipient</td><td>${receipt.recipient || ''}</td></tr>
      <tr><td>Recipient account</td><td>${receipt.recipientAccount || ''}</td></tr>
      <tr><td>Amount</td><td>${money(receipt.amount, receipt.currency)}</td></tr>
      <tr><td>Fee</td><td>${money(receipt.fee || 0, receipt.currency)}</td></tr>
      <tr><td>Total</td><td>${money(receipt.total || receipt.amount, receipt.currency)}</td></tr>
    </table></body></html>`);
    w.document.close();
    w.print();
  };

  if (receipt) {
    return (
      <>
        <PageIntro title="Transfer receipt" text="Your transfer has been processed." />
        <section className="panel receipt-panel">
          <div className="receipt-header"><h2>NEXA Microfinance Bank</h2><Status>{receipt.status}</Status></div>
          <div className="receipt-body">
            {[['Reference', receipt.reference], ['Date', new Date(receipt.date || Date.now()).toLocaleString()],
              ['Sender', receipt.sender], ['Sender account', receipt.senderAccount],
              ['Recipient', receipt.recipient], ['Recipient account', receipt.recipientAccount],
              ['Amount', money(receipt.amount, receipt.currency)], ['Fee', money(receipt.fee || 0, receipt.currency)],
            ].map(([k, v]) => <div className="receipt-row" key={k}><span>{k}</span><b>{v}</b></div>)}
            <div className="receipt-row total"><span>Total</span><b>{money(receipt.total || receipt.amount, receipt.currency)}</b></div>
          </div>
          <div className="form-actions">
            <Button onClick={printReceipt}><I.Printer /> Print receipt</Button>
            <Button variant="light" onClick={() => { const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = receipt.reference + '.json'; a.click(); }}>Download</Button>
            <Button variant="light" onClick={() => nav('/app/dashboard')}>Back to dashboard</Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro title="Send money" text="Send funds securely within NEXA or submit an external transfer request." />
      <div className="transfer-box">
        <div className="transfer-steps">
          <b className={step >= 1 ? 'on' : ''}>1 Recipient</b>
          <b className={step >= 2 ? 'on' : ''}>2 Amount</b>
          <b className={step >= 3 ? 'on' : ''}>3 Confirm</b>
        </div>
        {step === 1 && (
          <>
            <Field label="From account" value={form.fromAccountId} onChange={(e) => setForm({ ...form, fromAccountId: e.target.value })} select>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} · {a.currency} · {money(a.availableBalance, a.currency)}</option>)}
            </Field>
            <Field label="Transfer type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} select>
              <option value="internal">NEXA customer</option>
              <option value="external">External bank</option>
            </Field>
            {form.type === 'internal' ? (
              <>
                <Field label="Account number or email" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} />
                <Button variant="light" onClick={lookup}>Find recipient</Button>
                {recipient && (
                  <div className="recipient-found">
                    <div className="avatar">{recipient.name?.[0]}</div>
                    <div>
                      <strong>{recipient.name}</strong>
                      <small>{recipient.email} · {recipient.accounts?.[0]?.accountNumber}</small>
                    </div>
                  </div>
                )}
                {recipient?.accounts?.length > 1 && (
                  <Field label="Recipient account" value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })} select>
                    {recipient.accounts.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} · {a.currency}</option>)}
                  </Field>
                )}
              </>
            ) : (
              <>
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
                {countryConfig.requiredFields.includes('ifsc') && (
                  <Field label="IFSC Code" value={form.swift} onChange={(e) => setForm({ ...form, swift: e.target.value })} />
                )}
                {countryConfig.requiredFields.includes('branchCode') && (
                  <Field label="Branch Code" value={form.routing} onChange={(e) => setForm({ ...form, routing: e.target.value })} />
                )}
                {(countryConfig.requiredFields.includes('iban') || countryConfig.requiredFields.includes('swift')) && (
                  <Field label="SWIFT / BIC Code" value={form.swift} onChange={(e) => setForm({ ...form, swift: e.target.value })} />
                )}
              </>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <Field label={'Amount (' + (from?.currency || '') + ')'} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Field label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            <div className="currency-note">Available: <strong>{money(from?.availableBalance, from?.currency)}</strong></div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="review">
              <p>Recipient <strong>{form.type === 'internal' ? recipient?.name : form.recipientName}</strong></p>
              <p>Amount <strong>{money(Number(form.amount || 0), from?.currency)}</strong></p>
              <p>From <strong>{from?.accountNumber}</strong></p>
            </div>
            <Field label="Confirm with 4-digit PIN" type="password" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
          </>
        )}
        <div className="form-actions">
          {step > 1 && <Button variant="light" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button onClick={() => (step < 3 ? setStep(step + 1) : complete())}>
            {step === 3 ? 'Confirm transfer' : 'Continue'} <I.ArrowRight />
          </Button>
        </div>
      </div>
    </>
  );
}
