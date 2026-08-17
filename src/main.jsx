import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as I from 'lucide-react';
import './styles.css';
import Logo from './components/Logo';
import Button from './components/Button';
import Status from './components/Status';
import ErrorBoundary from './components/ErrorBoundary';
import { countries, nav } from './data/config';
import { loadTransactions, saveTransactions, loadBeneficiaries, saveBeneficiaries, loadLoans, saveLoans, loadCards, saveCards, loadNotifications, saveNotifications, loadSupportTickets, saveSupportTickets } from './utils/data';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transfer from './pages/Transfer';
import Crypto from './pages/Crypto';
import FeaturePage from './pages/FeaturePage';
import Admin from './pages/Admin';
import NotificationsPage from './pages/NotificationsPage';
import SupportPage from './pages/SupportPage';

const emptyUser = { name: '', email: '', country: 'US', status: 'PENDING', role: 'customer', balance: 0, available: 0, initials: '' };

function App() {
  const [route, setRoute] = useState('home');
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('nexa-user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('nexa-users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [notice, setNotice] = useState('');
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('nexa-user', JSON.stringify(user));
    else localStorage.removeItem('nexa-user');
    localStorage.setItem('nexa-users', JSON.stringify(users));
  }, [user, users]);

  const go = (r) => { setRoute(r); window.scrollTo(0, 0); };
  const toast = (t) => { setNotice(t); setTimeout(() => setNotice(''), 3500); };

  const bankRoutes = ['dashboard', 'accounts', 'transfers', 'beneficiaries', 'transactions', 'cards', 'loans', 'savings', 'crypto', 'bills', 'settings', 'notifications', 'support'];
  const isBank = bankRoutes.includes(route);

  let view;
  if (route === 'home') view = <Home go={go} />;
  else if (route === 'register') view = <Register go={go} setUser={setUser} setUsers={setUsers} toast={toast} />;
  else if (route === 'login') view = <Login go={go} users={users} setUser={setUser} setAdmin={setAdmin} toast={toast} />;
  else if (route === 'admin') view = <Admin go={go} users={users} setUsers={setUsers} toast={toast} />;
  else if (isBank && user) view = <Bank user={user} setUser={setUser} go={go} route={route} toast={toast} />;
  else if (isBank && !user) { setRoute('login'); return null; }
  else view = <Home go={go} />;

  return (
    <>
      {view}
      {notice && <div className="toast"><I.CircleCheck /> {notice}</div>}
    </>
  );
}

function Bank({ user, setUser, go, route, toast }) {
  const [hidden, setHidden] = useState(false);
  const [mobile, setMobile] = useState(false);

  const title = route[0].toUpperCase() + route.slice(1);

  return (
    <div className="bank">
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <Logo />
        <nav className="nav">
          {nav.map(([label, icon]) => {
            const Icon = I[icon];
            return (
              <button key={label} className={route === label.toLowerCase() ? 'active' : ''} onClick={() => { go(label.toLowerCase()); setMobile(false); }}>
                {Icon && <Icon size={18} />}
                {label}
              </button>
            );
          })}
        </nav>
        <button className="logout" onClick={() => { go('home'); setMobile(false); }}>
          <I.LogOut size={18} />
          Log out
        </button>
      </aside>
      {mobile && <div className="sidebar-overlay" onClick={() => setMobile(false)} />}
      <main className="bank-main">
        <header className="app-header">
          <button className="mobile-menu" onClick={() => setMobile(!mobile)}>
            <span className="hamburger">{mobile ? '✕' : '☰'}</span>
          </button>
          <div>
            <p className="greet">Good evening,</p>
            <h2>{user.name} <span className="verified">✓</span></h2>
            <p className="country">{user.country && countries[user.country]?.flag} {user.country ? countries[user.country]?.name : 'United States'}</p>
          </div>
          <div className="head-actions">
            <button className="bell">
              <I.Bell />
              <b>3</b>
            </button>
            <button className="avatar">
              {user.photo ? <img src={user.photo} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : user.initials}
            </button>
          </div>
        </header>
        {route === 'dashboard' && <Dashboard user={user} hidden={hidden} setHidden={setHidden} go={go} />}
        {route === 'accounts' && <Accounts user={user} />}
        {route === 'transfers' && <Transfer user={user} setUser={setUser} users={users} setUsers={setUsers} toast={toast} go={go} />}
        {route === 'crypto' && <Crypto />}
        {route === 'beneficiaries' && <BeneficiariesPage user={user} toast={toast} />}
        {route === 'transactions' && <TransactionsPage user={user} toast={toast} />}
        {route === 'cards' && <CardsPage user={user} toast={toast} />}
        {route === 'loans' && <LoansPage user={user} toast={toast} />}
        {route === 'savings' && <SavingsPage user={user} toast={toast} />}
        {route === 'bills' && <BillsPage user={user} toast={toast} />}
        {route === 'settings' && <SettingsPage user={user} setUser={setUser} toast={toast} go={go} />}
        {route === 'notifications' && <NotificationsPage user={user} toast={toast} />}
        {route === 'support' && <SupportPage user={user} toast={toast} />}
        {!['dashboard', 'accounts', 'transfers', 'beneficiaries', 'transactions', 'cards', 'loans', 'savings', 'crypto', 'bills', 'settings', 'notifications', 'support'].includes(route) && (
          <FeaturePage title={title} user={user} toast={toast} />
        )}
      </main>
      <nav className="bottom-nav">
        {[
          ['dashboard', I.Home, 'Home'],
          ['accounts', I.WalletCards, 'Accounts'],
          ['transfers', I.ArrowLeftRight, 'Transfer'],
          ['crypto', I.Bitcoin, 'Crypto'],
          ['settings', I.MoreHorizontal, 'More'],
        ].map(([r, Icon, n]) => (
          <button key={r} className={route === r ? 'active' : ''} onClick={() => go(r)}>
            <Icon size={20} />
            <small>{n}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}

function BeneficiariesPage({ user, toast }) {
  const [bens, setBens] = useState(() => loadBeneficiaries().filter(b => b.userEmail === user.email));
  const [form, setForm] = useState({ name: '', bank: '', country: user.country, account: '', currency: user.country ? countries[user.country]?.currency : 'USD' });
  const [editing, setEditing] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addBeneficiary = () => {
    if (!form.name || !form.account) return toast('Please fill in beneficiary name and account.');
    const newBen = { ...form, id: Date.now().toString(), userEmail: user.email, dateAdded: new Date().toISOString() };
    const updated = editing ? bens.map(b => b.id === editing ? newBen : b) : [...bens, newBen];
    setBens(updated);
    saveBeneficiaries([...loadBeneficiaries().filter(b => b.userEmail !== user.email), ...updated]);
    setForm({ name: '', bank: '', country: user.country, account: '', currency: user.country ? countries[user.country]?.currency : 'USD' });
    setEditing(null);
    toast(editing ? 'Beneficiary updated.' : 'Beneficiary added.');
  };

  const deleteBeneficiary = (id) => {
    const updated = bens.filter(b => b.id !== id);
    setBens(updated);
    saveBeneficiaries([...loadBeneficiaries().filter(b => b.userEmail !== user.email), ...updated]);
    toast('Beneficiary removed.');
  };

  const editBeneficiary = (b) => {
    setForm(b);
    setEditing(b.id);
  };

  return (
    <>
      <PageIntro title="Beneficiaries" text="Manage saved recipients for faster transfers." />
      <section className="panel">
        <SectionTitle title={editing ? 'Edit beneficiary' : 'Add beneficiary'} />
        <div className="beneficiary-form">
          <Field label="Name" name="name" value={form.name} onChange={update} />
          <Field label="Bank" name="bank" value={form.bank} onChange={update} />
          <Field label="Country" name="country" value={form.country} onChange={update} select options={countries} />
          <Field label="Account number / IBAN" name="account" value={form.account} onChange={update} />
          <Button onClick={addBeneficiary}>{editing ? 'Update' : 'Add'} beneficiary</Button>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Saved beneficiaries" />
        {bens.length === 0 ? (
          <p className="muted">You haven't added any beneficiaries.</p>
        ) : (
          bens.map(b => (
            <div key={b.id} className="beneficiary-row">
              <div>
                <strong>{b.name}</strong>
                <small>{b.bank || 'NEXA'} · {b.country} · {b.account.slice(-4)}</small>
              </div>
              <div>
                <Button variant="light" onClick={() => editBeneficiary(b)}>Edit</Button>
                <Button variant="light" onClick={() => deleteBeneficiary(b.id)}>Remove</Button>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function TransactionsPage({ user, toast }) {
  const [txns, setTxns] = useState(() => loadTransactions().filter(t => t.userEmail === user.email));
  const [filter, setFilter] = useState('ALL');

  const filtered = txns.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <>
      <PageIntro title="Transactions" text="Your complete transaction history." />
      <section className="panel">
        <SectionTitle title="All transactions" />
        <div className="filter-bar">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="muted">No transactions found.</p>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="transaction-row">
              <div className="txn-icon"><span>{t.type === 'Deposit' ? '↓' : t.type === 'Withdrawal' ? '↑' : '↔'}</span></div>
              <div>
                <strong>{t.title}</strong>
                <small>{t.date} · {t.status}</small>
              </div>
              <b className={t.amount.startsWith('+') ? 'positive' : 'negative'}>{t.amount}</b>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function CardsPage({ user, toast }) {
  const [cards, setCards] = useState(() => loadCards().filter(c => c.userEmail === user.email));
  const [form, setForm] = useState({ type: 'Virtual', name: user.name, last4: '4821' });

  const addCard = () => {
    const newCard = { ...form, id: Date.now().toString(), userEmail: user.email, status: 'Active', expiry: '08/30' };
    const updated = [...cards, newCard];
    setCards(updated);
    saveCards([...loadCards().filter(c => c.userEmail !== user.email), ...updated]);
    toast('Card created successfully.');
  };

  const toggleFreeze = (card) => {
    const updated = cards.map(c => c.id === card.id ? { ...c, status: c.status === 'Active' ? 'Frozen' : 'Active' } : c);
    setCards(updated);
    saveCards([...loadCards().filter(c => c.userEmail !== user.email), ...updated]);
    toast(card.status === 'Active' ? 'Card frozen.' : 'Card unfrozen.');
  };

  return (
    <>
      <PageIntro title="Cards" text="Manage your debit and virtual cards." />
      <section className="panel">
        <SectionTitle title="Create card" />
        <div className="card-form">
          <label className="field">Card type
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>Virtual</option>
              <option>Debit</option>
            </select>
          </label>
          <Field label="Cardholder name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Button onClick={addCard}>Create card</Button>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Your cards" />
        {cards.length === 0 ? (
          <p className="muted">You haven't created any cards yet.</p>
        ) : (
          cards.map(card => (
            <div key={card.id} className="card-item">
              <div className="fake-card">
                <Logo />
                <strong>••••  ••••  ••••  {card.last4}</strong>
                <small>{card.name.toUpperCase()}  {card.expiry}</small>
              </div>
              <div className="card-actions">
                <Status>{card.status}</Status>
                <Button variant="light" onClick={() => toggleFreeze(card)}>{card.status === 'Active' ? 'Freeze' : 'Unfreeze'}</Button>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function LoansPage({ user, toast }) {
  const [loans, setLoans] = useState(() => loadLoans().filter(l => l.userEmail === user.email));
  const [form, setForm] = useState({ amount: '', duration: '12', purpose: '', interest: '8' });

  const apply = () => {
    if (!form.amount || !form.purpose) return toast('Please fill in loan amount and purpose.');
    const newLoan = {
      id: Date.now().toString(),
      userEmail: user.email,
      amount: Number(form.amount),
      duration: Number(form.duration),
      interest: Number(form.interest),
      purpose: form.purpose,
      status: 'Pending',
      date: new Date().toISOString(),
      monthly: ((Number(form.amount) * (1 + Number(form.interest) / 100)) / Number(form.duration)).toFixed(2),
      paid: 0,
    };
    const updated = [...loans, newLoan];
    setLoans(updated);
    saveLoans([...loadLoans().filter(l => l.userEmail !== user.email), ...updated]);
    toast('Loan application submitted.');
  };

  return (
    <>
      <PageIntro title="Loans" text="Explore loan products and track repayment progress." />
      <section className="panel">
        <SectionTitle title="Apply for a loan" />
        <div className="loan-form">
          <Field label="Loan amount" name="amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <label className="field">Duration (months)
            <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
              {[6, 12, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} months</option>)}
            </select>
          </label>
          <label className="field">Interest rate (%)
            <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })}>
              {[5, 8, 10, 12, 15].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </label>
          <Field label="Purpose" name="purpose" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
          <Button onClick={apply}>Submit application</Button>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Your loans" />
        {loans.length === 0 ? (
          <p className="muted">No loan applications yet.</p>
        ) : (
          loans.map(loan => (
            <div key={loan.id} className="loan-item">
              <div>
                <strong>{loan.purpose}</strong>
                <small>${Number(loan.amount).toLocaleString()} · {loan.duration} months · {loan.interest}%</small>
              </div>
              <Status>{loan.status}</Status>
              <small>Monthly: ${loan.monthly}</small>
              <div className="progress-bar"><div style={{ width: (loan.paid / loan.amount * 100) + '%' }} /></div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

function SavingsPage({ user, toast }) {
  return (
    <>
      <PageIntro title="Savings goals" text="Build better habits with flexible savings plans." />
      <section className="panel empty">
        <div className="empty-icon"><I.PiggyBank /></div>
        <h3>Your savings space is ready</h3>
        <p>Use the controls above to begin managing your savings.</p>
        <Button onClick={() => toast('This feature is available in the NEXA platform.')}>Get started</Button>
      </section>
    </>
  );
}

function BillsPage({ user, toast }) {
  return (
    <>
      <PageIntro title="Bill payments" text="Manage bills inside the NEXA platform." />
      <section className="panel empty">
        <div className="empty-icon"><I.FileText /></div>
        <h3>Your bill payments space is ready</h3>
        <p>Use the controls above to begin managing your bills.</p>
        <Button onClick={() => toast('This feature is available in the NEXA platform.')}>Get started</Button>
      </section>
    </>
  );
}

function SettingsPage({ user, setUser, toast, go }) {
  const [form, setForm] = useState({ ...user });
  const [photo, setPhoto] = useState(user.photo || null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast('Photo must be under 5MB.');
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    setUser({ ...user, ...form, photo: photo || user.photo });
    toast('Profile updated successfully.');
  };

  const logout = () => {
    localStorage.clear();
    go('home');
  };

  return (
    <>
      <PageIntro title="Profile & settings" text="Keep your personal details and preferences up to date." />
      <section className="panel">
        <SectionTitle title="Profile picture" />
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:20}}>
          <label className="upload" style={{marginBottom:0,padding:20,cursor:'pointer',display:'inline-block'}}>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}} />
            {photo ? (
              <img src={photo} alt="Profile" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--blue)'}} />
            ) : (
              <>
                <I.Camera /> Upload photo <small>JPG or PNG, up to 5MB</small>
              </>
            )}
          </label>
          <div>
            <p style={{fontWeight:600,color:'var(--navy)'}}>{user.name}</p>
            <p style={{fontSize:13,color:'var(--muted)'}}>{user.email}</p>
          </div>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Personal information" />
        <div className="settings-grid">
          <Field label="Full name" name="name" value={form.name} onChange={update} />
          <Field label="Email" type="email" name="email" value={form.email} onChange={update} />
          <Field label="Phone" name="phone" value={form.phone || ''} onChange={update} />
          <Field label="Country" name="country" value={form.country} onChange={update} select options={countries} />
          <Field label="City" name="city" value={form.city || ''} onChange={update} />
          <Field label="Address" name="address" value={form.address || ''} onChange={update} />
        </div>
        <div className="form-actions">
          <Button onClick={save}>Save changes</Button>
        </div>
      </section>
      <section className="panel">
        <SectionTitle title="Security" />
        <p className="muted">Two-factor authentication architecture and login history are ready for implementation.</p>
      </section>
      <section className="panel">
        <SectionTitle title="Danger zone" />
        {confirmLogout ? (
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <p style={{fontSize:14,color:'var(--ink)'}}>Are you sure you want to log out?</p>
            <Button onClick={logout}>Yes, log out</Button>
            <Button variant="light" onClick={() => setConfirmLogout(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="light" onClick={() => setConfirmLogout(true)}>Log out</Button>
        )}
      </section>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444"><h2>Application Error</h2><pre>' + (event.message || 'Unknown error') + '</pre><button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;cursor:pointer">Reload</button></div>';
  }
});
