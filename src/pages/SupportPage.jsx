import { useState, useEffect } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import PageIntro from '../components/PageIntro';
import SectionTitle from '../components/SectionTitle';
import Status from '../components/Status';
import { loadSupportTickets, saveSupportTickets, loadNotifications, saveNotifications } from '../utils/data';
import { id } from '../data/config';

export default function SupportPage({ user, toast }) {
  const [tickets, setTickets] = useState(() => loadSupportTickets().filter(t => t.userEmail === user.email));
  const [form, setForm] = useState({ subject: '', message: '', priority: 'Medium' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    saveSupportTickets([...loadSupportTickets().filter(t => t.userEmail !== user.email), ...tickets]);
  }, [tickets, user.email]);

  const submitTicket = () => {
    if (!form.subject || !form.message) return toast('Please fill in subject and message.');
    const newTicket = {
      id: id(), userEmail: user.email, subject: form.subject, message: form.message,
      priority: form.priority, status: 'Open', date: new Date().toISOString(), replies: []
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    setForm({ subject: '', message: '', priority: 'Medium' });
    toast('Support ticket submitted successfully.');
  };

  const addReply = () => {
    if (!replyText.trim()) return;
    const updated = tickets.map(t =>
      t.id === replyTo ? { ...t, replies: [...t.replies, { text: replyText, date: new Date().toISOString() }] } : t
    );
    setTickets(updated);
    setReplyTo(null);
    setReplyText('');
    toast('Reply added.');
  };

  return (
    <>
      <PageIntro title="Support" text="Get help with your NEXA banking experience." />
      <section className="panel">
        <SectionTitle title="Create a support ticket" />
        <div className="support-form">
          <Field label="Subject" name="subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          <label className="field">Priority
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
            </select>
          </label>
          <Field label="Message" name="message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
          <Button onClick={submitTicket}>Submit ticket</Button>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Your tickets" />
        {tickets.length === 0 ? (
          <p className="muted">No support tickets yet.</p>
        ) : (
          tickets.map(t => (
            <div key={t.id} className="ticket-item">
              <div className="ticket-header">
                <div>
                  <strong>{t.subject}</strong>
                  <small>{new Date(t.date).toLocaleString()} · {t.priority}</small>
                </div>
                <Status>{t.status}</Status>
              </div>
              <p>{t.message}</p>
              {t.replies.length > 0 && (
                <div className="ticket-replies">
                  {t.replies.map((r, i) => (
                    <div key={i} className="reply">
                      <small>{new Date(r.date).toLocaleString()}</small>
                      <p>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {replyTo === t.id ? (
                <div className="reply-form">
                  <Field label="" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." />
                  <div className="form-actions">
                    <Button onClick={addReply}>Send reply</Button>
                    <Button variant="light" onClick={() => setReplyTo(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button variant="light" onClick={() => setReplyTo(t.id)}>Reply</Button>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}
