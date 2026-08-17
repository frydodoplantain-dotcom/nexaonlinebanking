import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: '', message: '', priority: 'MEDIUM' });
  const { toast } = useToast();
  const load = () => api.support.list().then(setTickets).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);
  return (
    <>
      <PageIntro title="Support" text="Get help with your NEXA banking experience." />
      <section className="panel">
        <Field label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Field label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} select>
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
        </Field>
        <Field label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button onClick={async () => { try { await api.support.create(form); toast('Ticket submitted.'); setForm({ subject: '', message: '', priority: 'MEDIUM' }); load(); } catch (e) { toast(e.message); } }}>Submit ticket</Button>
      </section>
      <section className="panel">
        {tickets.length === 0 ? <p className="muted">No support tickets yet.</p> : tickets.map((t) => (
          <div key={t.id} className="ticket-item">
            <div className="ticket-header"><div><strong>{t.subject}</strong><small>{new Date(t.createdAt).toLocaleString()}</small></div><Status>{t.status}</Status></div>
            <p>{t.message}</p>
            {(t.replies || []).map((r) => <div key={r.id} className="reply"><small>{r.isAdmin ? 'NEXA' : 'You'} · {new Date(r.createdAt).toLocaleString()}</small><p>{r.message}</p></div>)}
          </div>
        ))}
      </section>
    </>
  );
}
