import { useEffect, useState } from 'react';
import PageIntro from '../components/PageIntro';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import * as I from 'lucide-react';

const CATEGORIES = [
  'Account',
  'Transfer',
  'Transaction',
  'Card',
  'Loan',
  'Deposit',
  'Withdrawal',
  'Technical issue',
  'General enquiry',
];

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    category: 'General enquiry',
    message: '',
    priority: 'MEDIUM',
  });

  const { toast } = useToast();

  const load = () => {
    api.support.list().then((list) => {
      setTickets(list);
      if (selectedTicket) {
        const updated = list.find((x) => x.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    }).catch((e) => toast(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      toast('Please provide a subject and message.');
      return;
    }
    try {
      const ticket = await api.support.create(form);
      toast('Support conversation started.');
      setForm({ subject: '', category: 'General enquiry', message: '', priority: 'MEDIUM' });
      setShowNewModal(false);
      load();
      setSelectedTicket(ticket);
    } catch (e) {
      toast(e.message);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMsg.trim() || !selectedTicket) return;
    setSubmittingReply(true);
    try {
      await api.support.reply(selectedTicket.id, replyMsg);
      setReplyMsg('');
      load();
    } catch (e) {
      toast(e.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <PageIntro title="Customer Support" text="Need help? Chat directly with NEXA support agents." />
        <button className="btn primary" onClick={() => setShowNewModal(true)}>
          <I.PlusCircle size={16} /> New Conversation
        </button>
      </div>

      <div className="support-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 15 }}>
        {/* Ticket List Panel */}
        <section className="panel">
          <h3 className="section-title">Your Conversations</h3>
          {tickets.length === 0 ? (
            <p className="muted" style={{ padding: '20px 0' }}>No support conversations yet.</p>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const statusClass = {
                OPEN: 'status-green',
                IN_PROGRESS: 'status-blue',
                RESOLVED: 'status-gray',
                CLOSED: 'status-gray',
              }[t.status] || 'status-gray';

              return (
                <div
                  key={t.id}
                  className={`ticket-item-card clickable-row ${isSelected ? 'active-ticket' : ''}`}
                  onClick={() => setSelectedTicket(t)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-hover, rgba(255,255,255,0.08))' : 'transparent',
                    border: '1px solid var(--border-color, #334155)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge-inline" style={{ fontSize: 10 }}>{t.category || 'General'}</span>
                    <span className={`badge ${statusClass}`} style={{ fontSize: 10 }}>{t.status}</span>
                  </div>
                  <strong style={{ display: 'block', marginTop: 4, fontSize: 14 }}>{t.subject}</strong>
                  <small className="muted">{new Date(t.createdAt).toLocaleDateString()}</small>
                </div>
              );
            })
          )}
        </section>

        {/* Selected Ticket Conversation Chat Thread */}
        <section className="panel">
          {selectedTicket ? (
            <div className="chat-thread-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
              <div className="chat-thread-header" style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-color, #334155)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{selectedTicket.subject}</h3>
                  <span className={`badge status-${selectedTicket.status?.toLowerCase()}`}>{selectedTicket.status}</span>
                </div>
                <small className="muted">Category: {selectedTicket.category || 'General'} · Created {new Date(selectedTicket.createdAt).toLocaleString()}</small>
              </div>

              {/* Chat Messages */}
              <div className="chat-messages-box" style={{ flex: 1, overflowY: 'auto', padding: '15px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Initial Customer Message */}
                <div className="chat-bubble user-bubble" style={{ background: 'var(--primary-dark, #1e293b)', padding: 12, borderRadius: 10, alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <small className="muted" style={{ display: 'block', marginBottom: 4 }}>You (Initial Query)</small>
                  <p style={{ margin: 0 }}>{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {(selectedTicket.replies || []).map((r) => (
                  <div
                    key={r.id}
                    className={`chat-bubble ${r.isAdmin ? 'admin-bubble' : 'user-bubble'}`}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      alignSelf: r.isAdmin ? 'flex-end' : 'flex-start',
                      background: r.isAdmin ? 'var(--brand-accent, #3b82f6)' : 'var(--bg-secondary, #1e293b)',
                      color: r.isAdmin ? '#ffffff' : 'inherit',
                      maxWidth: '85%',
                    }}
                  >
                    <small style={{ opacity: 0.8, display: 'block', marginBottom: 4 }}>
                      {r.isAdmin ? '✦ NEXA Support Agent' : 'You'} · {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                    <p style={{ margin: 0 }}>{r.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {['OPEN', 'IN_PROGRESS'].includes(selectedTicket.status) ? (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-color, #334155)' }}>
                  <input
                    type="text"
                    placeholder="Type your reply here..."
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn primary" disabled={submittingReply || !replyMsg.trim()}>
                    <I.Send size={16} /> Send
                  </button>
                </form>
              ) : (
                <div className="muted-box" style={{ padding: 10, textAlign: 'center' }}>
                  <small className="muted">This support conversation is {selectedTicket.status?.toLowerCase()}.</small>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <I.MessageSquare size={48} className="muted" />
              <p className="muted" style={{ marginTop: 10 }}>Select a conversation from the left to view messages, or start a new one.</p>
            </div>
          )}
        </section>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>New Support Conversation</h3>
            <form onSubmit={handleCreateTicket} style={{ marginTop: 15 }}>
              <div className="field-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="field-group" style={{ marginTop: 12 }}>
                <label>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your enquiry"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div className="field-group" style={{ marginTop: 12 }}>
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="field-group" style={{ marginTop: 12 }}>
                <label>Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue in detail..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn outline" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Start Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
