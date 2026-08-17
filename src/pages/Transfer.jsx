import { useState, useMemo } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import SectionTitle from '../components/SectionTitle';
import { countries } from '../data/config';
import { money } from '../utils/money';
import { loadTransactions, saveTransactions, loadNotifications, saveNotifications, loadAuditLog, saveAuditLog } from '../utils/data';
import { id } from '../data/config';

export default function Transfer({ user, setUser, users, setUsers, toast, go }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: 'NEXA customer',
    country: user.country,
    recipientEmail: '',
    recipientName: '',
    bank: '',
    amount: '',
    reference: '',
    purpose: '',
  });
  const [fee, setFee] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const c = countries[form.country];
  const upd = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const recipient = useMemo(() => {
    if (!form.recipientEmail || form.type !== 'NEXA customer') return null;
    return users.find(u => u.email.toLowerCase() === form.recipientEmail.toLowerCase() && u.status === 'ACTIVE' && u.email !== user.email) || null;
  }, [form.recipientEmail, form.type, users, user.email]);

  const validate = () => {
    const amt = Number(form.amount);
    if (form.type === 'NEXA customer') {
      if (!recipient) return toast('Recipient not found or account is not active.');
      if (amt <= 0) return toast('Enter a valid amount.');
      if (amt > user.available) return toast('Insufficient available balance.');
    } else {
      if (!form.recipientName || !amt || amt > user.available) return toast('Enter a valid recipient and amount within your available balance.');
    }
    return null;
  };

  const complete = () => {
    const amt = Number(form.amount);
    const err = validate();
    if (err) return err;

    const txnId = id();
    const ref = 'NEXA-' + Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();
    const transferFee = form.type === 'NEXA customer' ? 0 : Math.max(2.5, amt * 0.01);
    const total = amt + transferFee;

    if (form.type === 'NEXA customer' && recipient) {
      const senderTxn = {
        id: txnId, userEmail: user.email, type: 'Transfer', title: `Transfer to ${recipient.name}`, amount: '-' + money(amt, c.currency),
        rawAmount: -amt, currency: c.currency, date: now, status: 'Completed', reference: ref, purpose: form.purpose, recipient: recipient.email, recipientName: recipient.name, fee: transferFee, total: -total
      };
      const recipientTxn = {
        id: id(), userEmail: recipient.email, type: 'Transfer', title: `Transfer from ${user.name}`, amount: '+' + money(amt, c.currency),
        rawAmount: amt, currency: c.currency, date: now, status: 'Completed', reference: ref, purpose: form.purpose, sender: user.email, senderName: user.name, fee: 0, total: amt
      };
      const allTxns = loadTransactions();
      saveTransactions([senderTxn, recipientTxn, ...allTxns]);

      const updatedSender = { ...user, balance: user.balance - total, available: user.available - total };
      const updatedRecipient = { ...recipient, balance: recipient.balance + amt, available: recipient.available + amt };
      setUser(updatedSender);
      setUsers(users.map(u => u.email === user.email ? updatedSender : u.email === recipient.email ? updatedRecipient : u));

      const senderNotif = { id: id(), userEmail: user.email, title: 'Transfer completed', message: `You sent ${money(amt, c.currency)} to ${recipient.name}.`, type: 'transfer', read: false, date: now };
      const recipientNotif = { id: id(), userEmail: recipient.email, title: 'Transfer received', message: `You received ${money(amt, c.currency)} from ${user.name}.`, type: 'transfer', read: false, date: now };
      saveNotifications([senderNotif, recipientNotif, ...loadNotifications()]);

      saveAuditLog([...loadAuditLog(), { id: id(), action: 'TRANSFER', target: user.email, detail: `Sent ${money(amt, c.currency)} to ${recipient.email}`, admin: user.email, date: now }]);

      setReceipt({ ref, date: now, sender: user.name, senderAccount: user.email, recipient: recipient.name, recipientAccount: recipient.email, amount: amt, currency: c.currency, fee: transferFee, total, status: 'Completed' });
      setCompleted(true);
      toast('Transfer completed successfully.');
    } else {
      const senderTxn = {
        id: txnId, userEmail: user.email, type: 'External Transfer', title: `External transfer to ${form.recipientName}`, amount: '-' + money(total, c.currency),
        rawAmount: -total, currency: c.currency, date: now, status: 'Pending', reference: ref, purpose: form.purpose, bank: form.bank, account: form.recipientEmail, fee: transferFee, total: -total
      };
      const allTxns = loadTransactions();
      saveTransactions([senderTxn, ...allTxns]);
      const updatedSender = { ...user, balance: user.balance - total, available: user.available - total };
      setUser(updatedSender);
      setUsers(users.map(u => u.email === user.email ? updatedSender : u));
      saveAuditLog([...loadAuditLog(), { id: id(), action: 'EXTERNAL_TRANSFER', target: user.email, detail: `External transfer ${money(total, c.currency)} to ${form.recipientName}`, admin: user.email, date: now }]);
      setReceipt({ ref, date: now, sender: user.name, senderAccount: user.email, recipient: form.recipientName, recipientAccount: form.recipientEmail, amount: amt, currency: c.currency, fee: transferFee, total, status: 'Pending' });
      setCompleted(true);
      toast('External transfer request submitted for processing.');
    }
  };

  const printReceipt = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Receipt - ${receipt.ref}</title><style>body{font-family:Arial;max-width:600px;margin:40px auto;color:#101b34}h1{color:#061b47}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #e9edf4}.right{text-align:right}.status{padding:4px 12px;border-radius:20px;background:#d1fae5;color:#065f46;font-size:12px;font-weight:700}</style></head><body>`);
    win.document.write(`<h1>NEXA Microfinance Bank</h1><p>Transaction Receipt</p><table><tr><td>Reference</td><td class="right">${receipt.ref}</td></tr><tr><td>Date</td><td class="right">${new Date(receipt.date).toLocaleString()}</td></tr><tr><td>Status</td><td class="right"><span class="status">${receipt.status}</span></td></tr><tr><td>Sender</td><td class="right">${receipt.sender}</td></tr><tr><td>Sender account</td><td class="right">${receipt.senderAccount}</td></tr><tr><td>Recipient</td><td class="right">${receipt.recipient}</td></tr><tr><td>Recipient account</td><td class="right">${receipt.recipientAccount}</td></tr><tr><td>Amount</td><td class="right">${money(receipt.amount, receipt.currency)}</td></tr><tr><td>Fee</td><td class="right">${money(receipt.fee, receipt.currency)}</td></tr><tr><td><strong>Total</strong></td><td class="right"><strong>${money(receipt.total, receipt.currency)}</strong></td></tr></table><p style="margin-top:40px;color:#778197;font-size:12px">NEXA Microfinance Bank — Controlled environment</p>`);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  if (completed && receipt) {
    return (
      <>
        <PageIntro title="Transfer receipt" text="Your transfer has been processed." />
        <section className="panel receipt-panel">
          <div className="receipt-header">
            <h2>NEXA Microfinance Bank</h2>
            <Status>{receipt.status}</Status>
          </div>
          <div className="receipt-body">
            <div className="receipt-row"><span>Reference</span><b>{receipt.ref}</b></div>
            <div className="receipt-row"><span>Date</span><b>{new Date(receipt.date).toLocaleString()}</b></div>
            <div className="receipt-row"><span>Sender</span><b>{receipt.sender}</b></div>
            <div className="receipt-row"><span>Sender account</span><b>{receipt.senderAccount}</b></div>
            <div className="receipt-row"><span>Recipient</span><b>{receipt.recipient}</b></div>
            <div className="receipt-row"><span>Recipient account</span><b>{receipt.recipientAccount}</b></div>
            <div className="receipt-row"><span>Amount</span><b>{money(receipt.amount, receipt.currency)}</b></div>
            <div className="receipt-row"><span>Fee</span><b>{money(receipt.fee, receipt.currency)}</b></div>
            <div className="receipt-row total"><span>Total</span><b>{money(receipt.total, receipt.currency)}</b></div>
          </div>
          <div className="form-actions">
            <Button onClick={printReceipt}><I.FileText /> Print receipt</Button>
            <Button variant="light" onClick={() => { setCompleted(false); setReceipt(null); setStep(1); go('dashboard'); }}>Back to dashboard</Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageIntro title="Send money" text="Send funds securely within NEXA or to external accounts." />
      <div className="transfer-box">
        <div className="transfer-steps">
          <b className={step >= 1 ? 'on' : ''}>1 <span>Recipient</span></b>
          <i />
          <b className={step >= 2 ? 'on' : ''}>2 <span>Amount</span></b>
          <i />
          <b className={step >= 3 ? 'on' : ''}>3 <span>Review</span></b>
        </div>
        {step === 1 && (
          <>
            <label className="field">Transfer type
              <select name="type" value={form.type} onChange={upd}>
                <option>NEXA customer</option>
                <option>External bank</option>
                <option>International transfer</option>
              </select>
            </label>
            {form.type === 'NEXA customer' ? (
              <>
                <Field label="Recipient email" name="recipientEmail" value={form.recipientEmail} onChange={upd} />
                {recipient && (
                  <div className="recipient-found">
                    <div className="avatar">{recipient.initials}</div>
                    <div><strong>{recipient.name}</strong><small>{countries[recipient.country]?.flag} {countries[recipient.country]?.name} · {recipient.email}</small></div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Field label="Recipient country" name="country" value={form.country} onChange={upd} select options={countries} />
                <div className="currency-note">{c.flag} Transfer currency: <strong>{c.currency} ({c.symbol})</strong>.</div>
                <Field label="Recipient name" name="recipientName" value={form.recipientName} onChange={upd} />
                <Field label="Bank name" name="bank" value={form.bank} onChange={upd} />
                <Field label="Account number / IBAN" name="recipientEmail" value={form.recipientEmail} onChange={upd} />
              </>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <Field label={'Amount (' + c.currency + ')'} name="amount" type="number" value={form.amount} onChange={upd} />
            <Field label="Transfer purpose" name="purpose" value={form.purpose} onChange={upd} />
            <Field label="Reference" name="reference" value={form.reference} onChange={upd} />
            <div className="currency-note">Available: <strong>{money(user.available, c.currency)}</strong></div>
          </>
        )}
        {step === 3 && (
          <div className="review">
            <p>Recipient <strong>{form.type === 'NEXA customer' ? recipient?.name : form.recipientName}</strong></p>
            <p>Bank <strong>{form.bank || 'NEXA internal'}</strong></p>
            <p>Amount <strong>{money(Number(form.amount), c.currency)}</strong></p>
            <p>Transfer fee <strong>{money(fee, c.currency)}</strong></p>
            <hr />
            <p>Total <strong>{money(Number(form.amount) + fee, c.currency)}</strong></p>
          </div>
        )}
        <div className="form-actions">
          {step > 1 && <Button variant="light" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button onClick={() => step < 3 ? setStep(step + 1) : complete()}>
            {step === 3 ? 'Confirm transfer' : 'Continue'} <I.ArrowRight />
          </Button>
        </div>
      </div>
    </>
  );
}
