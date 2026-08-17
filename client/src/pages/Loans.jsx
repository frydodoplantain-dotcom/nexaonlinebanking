import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';
import { money } from '../utils/money';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Loans() {
  const [settings, setSettings] = useState(null);
  const [data, setData] = useState({ applications: [], loans: [] });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    duration: '12',
    purpose: '',
    employmentStatus: 'Employed',
    monthlyIncome: '',
    idType: 'National ID',
    idNumber: '',
    familyContactName: '',
    familyContactRelationship: 'Parent',
    familyContactPhone: '',
    familyContactEmail: '',
    friendContactName: '',
    friendContactRelationship: 'Close Friend',
    friendContactPhone: '',
    friendContactEmail: '',
  });

  const { toast } = useToast();
  const load = () => api.loans.list().then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); api.loans.settings().then(setSettings); }, []);

  const [idDocFile, setIdDocFile] = useState(null);

  const apply = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.purpose) return toast('Please fill in loan amount and purpose.');
    if (!form.familyContactName || !form.familyContactPhone) return toast('Please enter Family Emergency Contact details.');
    if (!form.friendContactName || !form.friendContactPhone) return toast('Please enter Friend Emergency Contact details.');

    try {
      const fd = new FormData();
      Object.keys(form).forEach((k) => {
        if (form[k]) fd.append(k, form[k]);
      });
      if (idDocFile) fd.append('idDocument', idDocFile);

      await api.loans.apply(fd);
      toast('Loan application submitted successfully.');
      setShowApplyModal(false);
      load();
    } catch (err) { toast(err.message); }
  };

  return (
    <>
      <PageIntro title="Loans" text="Explore NEXA micro-loans, check terms, and submit verified applications." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        {settings && (
          <div className="currency-note">
            Borrow limits: <strong>{money(settings.minAmount)} – {money(settings.maxAmount)}</strong> · Interest: <strong>{settings.defaultInterest}%</strong>
          </div>
        )}
        <Button onClick={() => setShowApplyModal(true)}>+ Apply for New Loan</Button>
      </div>

      {showApplyModal && (
        <div className="modal-backdrop">
          <div className="modal-box card-box" style={{ maxWidth: 640 }}>
            <h3>Loan Application & Emergency Verification</h3>
            <form onSubmit={apply} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Loan Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                <Field label="Duration (months)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} select>
                  {[6, 12, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} months</option>)}
                </Field>
              </div>

              <Field label="Loan Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Business Expansion, Equipment" required />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Employment Status" value={form.employmentStatus} onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })} select>
                  <option value="Employed">Employed</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Business Owner">Business Owner</option>
                </Field>
                <Field label="Est. Monthly Income" type="number" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--gold)' }}>🪪 Identity Verification Document</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="ID Type" value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} select>
                    <option value="National ID">National ID Card</option>
                    <option value="Passport">International Passport</option>
                    <option value="Driver License">Driver's License</option>
                  </Field>
                  <Field label="ID Number" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} placeholder="Document ID No." />
                </div>
                <div style={{ background: '#132247', padding: 10, borderRadius: 6, marginTop: 8 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Upload ID Document (Image / PDF)</label>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setIdDocFile(e.target.files[0])} />
                  {idDocFile && <small style={{ color: 'var(--gold)', display: 'block', marginTop: 4 }}>📄 Attached: {idDocFile.name}</small>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--gold)' }}>👨‍👩‍👧 Family Emergency Contact</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Full Name" value={form.familyContactName} onChange={(e) => setForm({ ...form, familyContactName: e.target.value })} required />
                  <Field label="Relationship" value={form.familyContactRelationship} onChange={(e) => setForm({ ...form, familyContactRelationship: e.target.value })} placeholder="e.g. Parent, Sibling, Spouse" required />
                  <Field label="Phone Number" value={form.familyContactPhone} onChange={(e) => setForm({ ...form, familyContactPhone: e.target.value })} required />
                  <Field label="Email (Optional)" value={form.familyContactEmail} onChange={(e) => setForm({ ...form, familyContactEmail: e.target.value })} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--gold)' }}>🤝 Friend Emergency Contact</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Full Name" value={form.friendContactName} onChange={(e) => setForm({ ...form, friendContactName: e.target.value })} required />
                  <Field label="Relationship" value={form.friendContactRelationship} onChange={(e) => setForm({ ...form, friendContactRelationship: e.target.value })} placeholder="e.g. Close Friend, Colleague" required />
                  <Field label="Phone Number" value={form.friendContactPhone} onChange={(e) => setForm({ ...form, friendContactPhone: e.target.value })} required />
                  <Field label="Email (Optional)" value={form.friendContactEmail} onChange={(e) => setForm({ ...form, friendContactEmail: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <Button type="submit">Submit Loan Application</Button>
                <Button type="button" variant="secondary" onClick={() => setShowApplyModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="panel" style={{ marginTop: 16 }}>
        <h3>Your Active Loans & Applications</h3>
        {data.loans.length === 0 && data.applications.length === 0 ? <p className="muted">No loan applications found.</p> : null}
        {data.loans.map((loan) => (
          <div key={loan.id} className="loan-item" style={{ padding: 14, borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{loan.purpose}</strong>
              <Status>{loan.status}</Status>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '6px 0' }}>
              Principal: {money(loan.principal)} · Repaid: {money(loan.paidAmount)} · Balance Remaining: <strong>{money(loan.remainingBalance)}</strong>
            </div>
            <div className="progress-bar" style={{ height: 6, background: '#2a3b5c', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--gold)', width: Math.min(100, (loan.paidAmount / (loan.totalRepayment || 1)) * 100) + '%' }} />
            </div>
          </div>
        ))}
        {data.applications.map((a) => (
          <div key={a.id} className="loan-item" style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong>{a.purpose}</strong> <span style={{ color: 'var(--text-muted)' }}>({money(a.amount)})</span>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Term: {a.duration} Months · Family Ref: {a.familyContactName || 'Provided'}</div>
            </div>
            <Status>{a.status}</Status>
          </div>
        ))}
      </section>
    </>
  );
}
