import { useEffect, useState } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import PageIntro from '../components/PageIntro';
import Status from '../components/Status';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const { toast } = useToast();
  const load = () => api.customer.notifications().then(setItems).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);
  return (
    <>
      <PageIntro title="Notifications" text="Stay updated with your account activity." action={items.some((n) => !n.read) ? 'Mark all as read' : null} onAction={async () => { await api.customer.markAllRead(); load(); }} />
      <section className="panel">
        {items.length === 0 ? <p className="muted">No notifications yet.</p> : items.map((n) => (
          <div key={n.id} className={'notification-item ' + (n.read ? 'read' : 'unread')}>
            <div className="notification-icon"><I.Bell size={16} /></div>
            <div className="notification-content">
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <small>{new Date(n.createdAt).toLocaleString()}</small>
            </div>
            <Status>{n.read ? 'Read' : 'Unread'}</Status>
            <button className="notification-delete" onClick={async () => { await api.customer.deleteNotification(n.id); load(); }}><I.X size={16} /></button>
          </div>
        ))}
      </section>
    </>
  );
}
