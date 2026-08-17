import { useState, useEffect } from 'react';
import * as I from 'lucide-react';
import Button from '../components/Button';
import SectionTitle from '../components/SectionTitle';
import Status from '../components/Status';
import Logo from '../components/Logo';
import { countries, id, generateAccountNumbers } from '../data/config';
import { loadAuditLog, saveAuditLog, loadTransactions, saveTransactions, loadNotifications, saveNotifications, loadLoans, saveLoans, loadCards, saveCards } from '../utils/data';
import { money } from '../utils/money';

export default function Admin({ go, users, setUsers, toast }) {
  const [tab, setTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', country: 'US', address: '', status: 'ACTIVE' });

  useEffect(() => {
    setAuditLog(loadAuditLog());
  }, []);

  const pending = users.filter(x => x.status === 'PENDING APPROVAL');
  const addAudit = (action, target, detail) => {
    const entry = { id: id(), action, target, detail, admin: 'Administrator', date: new Date().toISOString() };
    const updated = [entry, ...auditLog];
    setAuditLog(updated);
    saveAuditLog(updated);
  };

  const approve = (u) => {
    const gen = generateAccountNumbers(u.country);
    setUsers(users.map(x => x.email === u.email ? { ...x, status: 'ACTIVE', balance: 500, available: 500, ...gen } : x));
    addAudit('APPROVED_USER', u.email, `Approved account for ${u.name}`);
    toast(`${u.name} has been approved and account details created.`);
  };

  const reject = (u) => {
    setUsers(users.map(x => x.email === u.email ? { ...x, status: 'REJECTED' } : x));
    addAudit('REJECTED_USER', u.email, `Rejected account for ${u.name}`);
    toast('Application rejected.');
  };

  const suspend = (u) => {
    setUsers(users.map(x => x.email === u.email ? { ...x, status: 'SUSPENDED' } : x));
    addAudit('SUSPENDED_USER', u.email, `Suspended account for ${u.name}`);
    toast(`${u.name}'s account has been suspended.`);
  };

  const activate = (u) => {
    setUsers(users.map(x => x.email === u.email ? { ...x, status: 'ACTIVE', available: 500 } : x));
    addAudit('ACTIVATED_USER', u.email, `Activated account for ${u.name}`);
    toast(`${u.name}'s account has been activated.`);
  };

  const createCustomer = () => {
    if (!createForm.name || !createForm.email) return toast('Name and email are required.');
    if (users.find(u => u.email.toLowerCase() === createForm.email.toLowerCase())) return toast('A customer with this email already exists.');
    const gen = generateAccountNumbers(createForm.country);
    const newUser = {
      name: createForm.name,
      email: createForm.email,
      phone: createForm.phone,
      country: createForm.country,
      address: createForm.address,
      status: createForm.status,
      role: 'customer',
      balance: createForm.status === 'ACTIVE' ? 500 : 0,
      available: createForm.status === 'ACTIVE' ? 500 : 0,
      initials: createForm.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      ...gen
    };
    const updated = [...users, newUser];
    setUsers(updated);
    addAudit('CREATED_USER', newUser.email, `Created customer ${newUser.name}`);
    toast('Customer created successfully.');
    setCreateForm({ name: '', email: '', phone: '', country: 'US', address: '', status: 'ACTIVE' });
    setTab('Users');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    ['Total users', users.length, I.Users],
    ['Pending approval', pending.length, I.Clock3],
    ['Active accounts', users.filter(x => x.status === 'ACTIVE').length, I.CircleCheck],
    ['Suspended accounts', users.filter(x => x.status === 'SUSPENDED').length, I.UserMinus],
    ['Total transactions', loadTransactions().length, I.ReceiptText],
    ['Active loans', users.filter(x => x.loans?.some(l => l.status === 'Active')).length, I.Landmark],
  ];

  return (
    <div className="admin">
      <aside className="admin-side">
        <Logo />
        <p>ADMIN CONSOLE</p>
        {[
          'Overview', 'Users', 'Pending approvals', 'Create customer',
          'Accounts', 'Transactions', 'Transfers', 'Loans', 'Cards', 'Reports', 'Audit logs', 'System settings'
        ].map(x => (
          <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x}</button>
        ))}
        <button onClick={() => go('home')} className="logout">Log out</button>
      </aside>
      <main>
        <header className="admin-head">
          <div>
            <p>Administration</p>
            <h1>{tab}</h1>
          </div>
          <Button onClick={() => setTab('Create customer')}><I.Plus /> Create customer</Button>
        </header>

        {tab === 'Overview' && (
          <>
            <section className="stat-grid">
              {stats.map(([a, b, Icon]) => (
                <article key={a}>
                  <span><Icon /></span>
                  <p>{a}</p>
                  <h2>{b}</h2>
                  <small>Live data</small>
                </article>
              ))}
            </section>
            <section className="admin-chart panel">
              <SectionTitle title="Platform activity" />
              <div className="bars">{[35, 55, 42, 74, 60, 88, 72, 94, 80, 100, 74, 90].map(n => <i key={n} style={{ height: n + '%' }} />)}</div>
            </section>
          </>
        )}

        {tab === 'Pending approvals' && (
          <section className="panel">
            <SectionTitle title="Registration review queue" />
            {pending.length === 0 ? (
              <p className="muted">No applications are waiting for review.</p>
            ) : (
              pending.map(u => (
                <div className="user-row" key={u.email}>
                  <span className="avatar">{u.initials}</span>
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email} · {countries[u.country]?.flag} {countries[u.country]?.name}</small>
                  </div>
                  <Status>{u.status}</Status>
                  <div>
                    <Button onClick={() => approve(u)}>Approve</Button>
                    <Button variant="light" onClick={() => reject(u)}>Reject</Button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'Users' && (
          <section className="panel">
            <SectionTitle title="Customers" />
            <div className="admin-controls">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING APPROVAL">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="muted">No customers found.</p>
            ) : (
              filteredUsers.map(u => (
                <div className="user-row" key={u.email}>
                  <span className="avatar">{u.initials}</span>
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email} · {countries[u.country]?.flag} {countries[u.country]?.name}</small>
                  </div>
                  <Status>{u.status}</Status>
                  <div>
                    <Button onClick={() => setSelectedUser(u)}>Review</Button>
                    {u.status === 'ACTIVE' && <Button variant="light" onClick={() => suspend(u)}>Suspend</Button>}
                    {u.status === 'SUSPENDED' && <Button variant="light" onClick={() => activate(u)}>Activate</Button>}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'Create customer' && (
          <section className="panel">
            <SectionTitle title="Create customer" />
            <div className="create-customer-form">
              <label className="field">Full name
                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
              </label>
              <label className="field">Email
                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </label>
              <label className="field">Phone
                <input type="text" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} />
              </label>
              <label className="field">Country
                <select value={createForm.country} onChange={e => setCreateForm({ ...createForm, country: e.target.value })}>
                  {Object.entries(countries).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}
                </select>
              </label>
              <label className="field">Address
                <input type="text" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} />
              </label>
              <label className="field">Account status
                <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING APPROVAL">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </label>
              <Button onClick={createCustomer}>Create customer</Button>
            </div>
          </section>
        )}

        {tab === 'Accounts' && (
          <section className="panel">
            <SectionTitle title="Customer accounts" />
            {users.length === 0 ? (
              <p className="muted">No accounts yet.</p>
            ) : (
              users.map(u => (
                <div key={u.email} className="user-row">
                  <span className="avatar">{u.initials}</span>
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email} · {countries[u.country]?.flag} {countries[u.country]?.name}</small>
                  </div>
                  <Status>{u.status}</Status>
                  <div style={{textAlign:'right'}}>
                    <strong>{money(u.balance, countries[u.country]?.currency)}</strong>
                    <small>Available: {money(u.available, countries[u.country]?.currency)}</small>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'Transactions' && (
          <section className="panel">
            <SectionTitle title="Create transaction" />
            <TransactionForm users={users} onCreate={(txn) => {
              const all = loadTransactions();
              saveTransactions([txn, ...all]);
              if (txn.type === 'Deposit' || txn.type === 'Interest' || txn.type === 'Refund') {
                setUsers(users.map(u => u.email === txn.userEmail ? { ...u, balance: u.balance + Number(txn.amount), available: u.available + Number(txn.amount) } : u));
              } else if (txn.type === 'Withdrawal' || txn.type === 'Fee') {
                setUsers(users.map(u => u.email === txn.userEmail ? { ...u, balance: u.balance - Number(txn.amount), available: Math.max(0, u.available - Number(txn.amount)) } : u));
              }
              addAudit('CREATED_TRANSACTION', txn.userEmail, `Created ${txn.type} of ${txn.amount}`);
              toast('Transaction created.');
            }} />
          </section>
        )}

        {tab === 'Loans' && (
          <section className="panel">
            <SectionTitle title="Loan applications" />
            {loadLoans().length === 0 ? (
              <p className="muted">No loan applications yet.</p>
            ) : (
              loadLoans().map(loan => (
                <div key={loan.id} className="user-row">
                  <div>
                    <strong>{loan.purpose}</strong>
                    <small>{loan.userEmail} · ${Number(loan.amount).toLocaleString()} · {loan.duration} months · {loan.interest}%</small>
                  </div>
                  <Status>{loan.status}</Status>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'Cards' && (
          <section className="panel">
            <SectionTitle title="Issued cards" />
            {loadCards().length === 0 ? (
              <p className="muted">No cards issued yet.</p>
            ) : (
              loadCards().map(card => (
                <div key={card.id} className="user-row">
                  <div>
                    <strong>{card.type} · {card.name}</strong>
                    <small>{card.userEmail} · •••• {card.last4} · Expires {card.expiry}</small>
                  </div>
                  <Status>{card.status}</Status>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'Reports' && (
          <section className="panel">
            <SectionTitle title="Reports" />
            <div className="report-grid">
              <article>
                <p>Total customers</p>
                <h2>{users.length}</h2>
              </article>
              <article>
                <p>Active accounts</p>
                <h2>{users.filter(u => u.status === 'ACTIVE').length}</h2>
              </article>
              <article>
                <p>Total transactions</p>
                <h2>{loadTransactions().length}</h2>
              </article>
              <article>
                <p>Total loans</p>
                <h2>{loadLoans().length}</h2>
              </article>
              <article>
                <p>Total cards</p>
                <h2>{loadCards().length}</h2>
              </article>
            </div>
          </section>
        )}

        {tab === 'Audit logs' && (
          <section className="panel">
            <SectionTitle title="Audit log" />
            {auditLog.length === 0 ? (
              <p className="muted">No audit entries yet.</p>
            ) : (
              <div className="audit-table">
                {auditLog.map(entry => (
                  <div key={entry.id} className="audit-row">
                    <span className="audit-action">{entry.action}</span>
                    <span className="audit-target">{entry.target}</span>
                    <span className="audit-detail">{entry.detail}</span>
                    <span className="audit-date">{new Date(entry.date).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'System settings' && (
          <section className="panel">
            <SectionTitle title="System settings" />
            <p className="muted">Platform configuration, fee management, and system preferences are available here.</p>
          </section>
        )}

        {!['Overview', 'Users', 'Pending approvals', 'Create customer', 'Accounts', 'Transactions', 'Loans', 'Cards', 'Reports', 'Audit logs', 'System settings'].includes(tab) && (
          <section className="panel">
            <SectionTitle title={tab} />
            <p className="muted">This section is ready for implementation.</p>
          </section>
        )}
      </main>

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Customer Review</h3>
              <button onClick={() => setSelectedUser(null)}><I.X /></button>
            </div>
            <div className="modal-body">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Country:</strong> {countries[selectedUser.country]?.flag} {countries[selectedUser.country]?.name}</p>
              <p><strong>Status:</strong> <Status>{selectedUser.status}</Status></p>
              <p><strong>Balance:</strong> {money(selectedUser.balance, countries[selectedUser.country]?.currency)}</p>
              <p><strong>Available:</strong> {money(selectedUser.available, countries[selectedUser.country]?.currency)}</p>
            </div>
            <div className="modal-foot">
              {selectedUser.status === 'PENDING APPROVAL' && (
                <>
                  <Button onClick={() => { approve(selectedUser); setSelectedUser(null); }}>Approve</Button>
                  <Button variant="light" onClick={() => { reject(selectedUser); setSelectedUser(null); }}>Reject</Button>
                </>
              )}
              {selectedUser.status === 'ACTIVE' && <Button variant="light" onClick={() => { suspend(selectedUser); setSelectedUser(null); }}>Suspend</Button>}
              {selectedUser.status === 'SUSPENDED' && <Button variant="light" onClick={() => { activate(selectedUser); setSelectedUser(null); }}>Activate</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionForm({ users, onCreate }) {
  const [form, setForm] = useState({ userEmail: '', type: 'Deposit', amount: '', currency: 'USD', description: '', reference: '', status: 'Completed' });
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => {
    if (!form.userEmail || !form.amount) return;
    const txn = {
      id: Date.now().toString(),
      ...form,
      amount: Number(form.amount),
      date: new Date().toISOString(),
    };
    onCreate(txn);
    setForm({ userEmail: '', type: 'Deposit', amount: '', currency: 'USD', description: '', reference: '', status: 'Completed' });
  };

  return (
    <div className="admin-txn-form">
      <label className="field">Customer
        <select name="userEmail" value={form.userEmail} onChange={update}>
          <option value="">Select customer</option>
          {users.map(u => <option key={u.email} value={u.email}>{u.name} ({u.email})</option>)}
        </select>
      </label>
      <label className="field">Type
        <select name="type" value={form.type} onChange={update}>
          <option>Deposit</option>
          <option>Withdrawal</option>
          <option>Transfer</option>
          <option>Payment</option>
          <option>Refund</option>
          <option>Interest</option>
          <option>Fee</option>
        </select>
      </label>
      <label className="field">Amount
        <input type="number" name="amount" value={form.amount} onChange={update} />
      </label>
      <label className="field">Currency
        <select name="currency" value={form.currency} onChange={update}>
          <option>USD</option><option>GBP</option><option>EUR</option><option>NGN</option><option>JPY</option>
        </select>
      </label>
      <label className="field">Description
        <input type="text" name="description" value={form.description} onChange={update} />
      </label>
      <label className="field">Reference
        <input type="text" name="reference" value={form.reference} onChange={update} />
      </label>
      <label className="field">Status
        <select name="status" value={form.status} onChange={update}>
          <option>Completed</option>
          <option>Pending</option>
          <option>Failed</option>
        </select>
      </label>
      <Button onClick={submit}>Create transaction</Button>
    </div>
  );
}
