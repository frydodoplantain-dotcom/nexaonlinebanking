import { useState, useEffect } from 'react';
import * as I from 'lucide-react';
import PageIntro from '../components/PageIntro';
import SectionTitle from '../components/SectionTitle';
import Status from '../components/Status';
import { loadNotifications, saveNotifications } from '../utils/data';
import { id } from '../data/config';

export default function NotificationsPage({ user, toast }) {
  const [notifications, setNotifications] = useState(() =>
    loadNotifications().filter(n => n.userEmail === user.email)
  );

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications([...loadNotifications().filter(n => n.userEmail !== user.email), ...updated]);
    toast('All notifications marked as read.');
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications([...loadNotifications().filter(n => n.userEmail !== user.email), ...updated]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <PageIntro title="Notifications" text="Stay updated with your account activity." />
      <section className="panel">
        <div className="section-title" style={{marginTop:0}}>
          <SectionTitle title={`All notifications (${unreadCount} unread)`} />
          {unreadCount > 0 && <button onClick={markAllRead}>Mark all as read</button>}
        </div>
        {notifications.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
              <div className="notification-icon">
                {n.type === 'transfer' && <I.ArrowLeftRight />}
                {n.type === 'account' && <I.WalletCards />}
                {n.type === 'security' && <I.ShieldCheck />}
                {n.type === 'loan' && <I.Landmark />}
                {n.type === 'system' && <I.Bell />}
              </div>
              <div className="notification-content">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small>{new Date(n.date).toLocaleString()}</small>
              </div>
              <Status>{n.read ? 'Read' : 'Unread'}</Status>
              <button className="notification-delete" onClick={() => deleteNotification(n.id)}>
                <I.X size={16} />
              </button>
            </div>
          ))
        )}
      </section>
    </>
  );
}
