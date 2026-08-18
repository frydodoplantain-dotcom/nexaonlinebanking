import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Logo from '../components/Logo';
import { nav as navItems, countries } from '../data/config';
import { formatName, greeting } from '../utils/money';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function BankLayout() {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);
  const [unread, setUnread] = useState(0);
  const loc = useLocation();
  const go = useNavigate();
  const route = loc.pathname.split('/').pop();
  const profile = user?.profile;
  const c = countries[profile?.country] || countries.US;
  const initials = ((profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || '')).toUpperCase();

  useEffect(() => {
    api.customer.notifications().then((n) => setUnread(n.filter((x) => !x.read).length)).catch(() => {});
  }, [loc.pathname]);

  const signOut = async () => {
    await logout();
    go('/');
  };

  return (
    <div className="bank">
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <Logo />
        <nav className="nav">
          {navItems.map(([label, icon]) => {
            const Icon = I[icon];
            const path = label.toLowerCase();
            return (
              <button key={label} className={route === path ? 'active' : ''} onClick={() => { go('/app/' + path); setMobile(false); }}>
                {Icon && <Icon size={18} />} {label}
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={signOut}><I.LogOut size={18} /> Log out</button>
      </aside>
      {mobile && <div className="sidebar-overlay" onClick={() => setMobile(false)} />}
      <main className="bank-main">
        <div className="dash-top">
          <div className="dash-top-bar">
            <button className="mobile-menu" onClick={() => setMobile(!mobile)}><I.Menu /></button>
            <Logo />
            <button className="bell gold" onClick={() => go('/app/notifications')}>
              <I.Bell size={18} />
              {unread > 0 && <b>{unread}</b>}
            </button>
          </div>
          <div className="dash-profile">
            <span className="avatar" style={{ position: 'relative' }}>
              {profile?.photoPath ? <img src={profile.photoPath} alt="" /> : initials}
              <i className="online-dot" />
            </span>
            <div>
              <p>{greeting()},</p>
              <h2>{formatName(profile)} <span className="verified">✓</span></h2>
              <p>{c.flag} {c.name}</p>
            </div>
          </div>
        </div>
        <header className="app-header">
          <div>
            <p className="greet">{greeting()},</p>
            <h2>{formatName(profile)} <span className="verified">✓</span></h2>
            <p className="country">{c.flag} {c.name}</p>
          </div>
          <div className="head-actions">
            <button className="bell gold" onClick={() => go('/app/notifications')}>
              <I.Bell />
              {unread > 0 && <b>{unread}</b>}
            </button>
            <button className="avatar" onClick={() => go('/app/settings')}>
              {profile?.photoPath ? <img src={profile.photoPath} alt="" /> : initials}
            </button>
          </div>
        </header>
        <div className="page-pad">
          <Outlet />
        </div>
      </main>
      <nav className="bottom-nav">
        {[
          ['dashboard', I.Home, 'Home'],
          ['accounts', I.WalletCards, 'Accounts'],
          ['transfers', I.ArrowLeftRight, 'Transfer', true],
          ['crypto', I.Bitcoin, 'Crypto'],
          ['more', I.LayoutGrid, 'More'],
        ].map(([r, Icon, n, fab]) => (
          <button key={r} className={((r === 'more' ? mobileMore : route === r) ? 'active ' : '') + (fab ? 'fab' : '')} onClick={() => r === 'more' ? setMobileMore(true) : go('/app/' + r)}>
            <Icon size={fab ? 22 : 20} />
            {!fab && <small>{n}</small>}
          </button>
        ))}
      </nav>
      {mobileMore && (
        <div className="mobile-more-overlay" onClick={() => setMobileMore(false)}>
          <section className="mobile-more-sheet" onClick={(e) => e.stopPropagation()} aria-label="More banking features">
            <div className="mobile-more-heading"><div><h3>More services</h3><p>All banking features are available on mobile.</p></div><button onClick={() => setMobileMore(false)} aria-label="Close menu"><I.X /></button></div>
            <div className="mobile-more-grid">
              {[
                ['transactions', I.ReceiptText, 'Transactions'], ['receive', I.ArrowDownToLine, 'Receive'],
                ['deposit', I.Landmark, 'Deposit'], ['withdraw', I.ArrowUpFromLine, 'Withdraw'],
                ['cards', I.CreditCard, 'Cards'], ['loans', I.Landmark, 'Loans'],
                ['notifications', I.Bell, 'Notifications'], ['support', I.MessageCircle, 'Support'],
                ['settings', I.Settings, 'Profile & settings'],
              ].map(([path, Icon, label]) => (
                <button key={path} onClick={() => { go('/app/' + path); setMobileMore(false); }}><Icon /><span>{label}</span></button>
              ))}
            </div>
            <button className="mobile-more-logout" onClick={signOut}><I.LogOut /> Log out</button>
          </section>
        </div>
      )}
    </div>
  );
}
