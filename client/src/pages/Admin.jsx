import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Button from '../components/Button';
import Field from '../components/Field';
import Status from '../components/Status';
import Logo from '../components/Logo';
import { countries } from '../data/config';
import { money, formatName } from '../utils/money';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TABS = ['Overview', 'Pending approvals', 'External Transfers', 'Crypto Management', 'KYC Verification', 'Users', 'Create customer', 'Accounts', 'Transactions', 'Transfers', 'Loans', 'Cards', 'Reports', 'Audit logs', 'Notifications', 'Support', 'Settings'];

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const [adminMobileOpen, setAdminMobileOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const { logout } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    if (tab === 'Overview') api.admin.overview().then(setOverview).catch((e) => toast(e.message));
  }, [tab]);

  return (
    <div className="admin">
      <aside className={`admin-side ${adminMobileOpen ? 'open' : ''}`}>
        <Logo />
        <p>ADMIN CONSOLE</p>
        {TABS.map((x) => (
          <button key={x} className={tab === x ? 'active' : ''} onClick={() => { setTab(x); setAdminMobileOpen(false); }}>{x}</button>
        ))}
        <button className="logout" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
      </aside>
      {adminMobileOpen && <div className="sidebar-overlay" onClick={() => setAdminMobileOpen(false)} />}
      <main>
        <header className="admin-head" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn outline btn-xs mobile-menu" onClick={() => setAdminMobileOpen(!adminMobileOpen)} style={{ padding: '6px 10px' }}>
              <I.Menu size={18} /> Menu
            </button>
            <div>
              <p>Administration</p>
              <h1>{tab}</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="admin-tab-select"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
              style={{ padding: '6px 12px', background: '#132247', color: '#fff', border: '1px solid var(--border)', borderRadius: 6 }}
            >
              {TABS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
            <Button onClick={() => setTab('Create customer')}><I.Plus /> Create customer</Button>
          </div>
        </header>
        {tab === 'Overview' && overview && <Overview stats={overview} setTab={setTab} toast={toast} />}
        {tab === 'Pending approvals' && <Approvals toast={toast} />}
        {tab === 'External Transfers' && <ExternalTransfersReview toast={toast} />}
        {tab === 'Crypto Management' && <CryptoAdminTab toast={toast} />}
        {tab === 'KYC Verification' && <KycTab toast={toast} />}
        {tab === 'Users' && <Users toast={toast} />}
        {tab === 'Create customer' && <CreateCustomer toast={toast} onDone={() => setTab('Users')} />}
        {tab === 'Accounts' && <AccountsTab toast={toast} />}
        {tab === 'Transactions' && <TransactionsTab toast={toast} />}
        {tab === 'Transfers' && <TransfersTab toast={toast} />}
        {tab === 'Loans' && <LoansTab toast={toast} />}
        {tab === 'Cards' && <CardsTab toast={toast} />}
        {tab === 'Reports' && <ReportsTab toast={toast} />}
        {tab === 'Audit logs' && <AuditTab toast={toast} />}
        {tab === 'Notifications' && <AdminNotifs toast={toast} />}
        {tab === 'Support' && <SupportTab toast={toast} />}
        {tab === 'Settings' && <SettingsTab toast={toast} />}
      </main>
    </div>
  );
}

function Overview({ stats, setTab, toast }) {
  const [pendingCounts, setPendingCounts] = useState(null);

  useEffect(() => {
    api.admin.pendingActions().then(setPendingCounts).catch(() => {});
  }, []);

  const cards = [
    ['Total customers', stats.totalCustomers, I.Users],
    ['Pending applications', stats.pendingApplications, I.Clock3],
    ['Active customers', stats.activeCustomers, I.CircleCheck],
    ['Suspended', stats.suspendedCustomers, I.UserMinus],
    ['Total balances', stats.totalBalance, I.Wallet],
    ['Transactions', stats.totalTransactions, I.ReceiptText],
    ['Transfers', stats.totalTransfers, I.ArrowLeftRight],
    ['Pending transfers', stats.pendingTransfers, I.Clock],
    ['Loans', stats.totalLoans, I.Landmark],
    ['Active loans', stats.activeLoans, I.Landmark],
    ['Cards', stats.totalCards, I.CreditCard],
  ];
  const max = Math.max(1, ...(stats.chartData || []).map((x) => Number(x.count)));

  return (
    <>
      {/* Pending Actions Center */}
      {pendingCounts && (
        <section className="panel" style={{ marginBottom: 20, borderColor: 'var(--brand-accent, #3b82f6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.AlertCircle color="#f59e0b" /> Pending-Action Center ({pendingCounts.totalPending})
            </h3>
            <small className="muted">Live items requiring admin review</small>
          </div>
          <div className="pending-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div className="pending-card clickable-row" onClick={() => setTab('External Transfers')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">External Transfers</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingTransfers > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingTransfers}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Review transfers →</small>
            </div>
            <div className="pending-card clickable-row" onClick={() => setTab('Crypto Management')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">Crypto Deposits</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingCryptoDeposits > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingCryptoDeposits}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Review deposits →</small>
            </div>
            <div className="pending-card clickable-row" onClick={() => setTab('Pending approvals')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">Account Apps</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingApplications > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingApplications}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Review applications →</small>
            </div>
            <div className="pending-card clickable-row" onClick={() => setTab('Loans')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">Loan Apps</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingLoans > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingLoans}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Review loans →</small>
            </div>
            <div className="pending-card clickable-row" onClick={() => setTab('Support')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">Support Conversations</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingSupportTickets > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingSupportTickets}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Open inbox →</small>
            </div>
            <div className="pending-card clickable-row" onClick={() => setTab('KYC Verification')} style={{ padding: 12, borderRadius: 8, background: '#132247', cursor: 'pointer' }}>
              <small className="muted">KYC Documents</small>
              <h2 style={{ margin: '4px 0', color: pendingCounts.pendingKyc > 0 ? '#f59e0b' : 'inherit' }}>{pendingCounts.pendingKyc}</h2>
              <small style={{ color: 'var(--brand-accent)' }}>Verify KYC →</small>
            </div>
          </div>
        </section>
      )}

      <section className="stat-grid">
        {cards.map(([a, b, Icon]) => (
          <article key={a}><span><Icon /></span><p>{a}</p><h2>{typeof b === 'number' && a.includes('balance') ? money(b) : b}</h2><small>Live data</small></article>
        ))}
      </section>
      <section className="panel">
        <h3>Platform activity</h3>
        <div className="bars">
          {(stats.chartData || []).length === 0
            ? <p className="muted">No activity yet.</p>
            : (stats.chartData || []).map((x) => <i key={x.month} title={x.month} style={{ height: (Number(x.count) / max) * 100 + '%' }} />)}
        </div>
      </section>
    </>
  );
}

function ExternalTransfersReview({ toast }) {
  const [data, setData] = useState({ items: [] });
  const [filterStatus, setFilterStatus] = useState('PENDING');

  const load = () => {
    api.admin.transfers({ status: filterStatus, type: 'EXTERNAL' })
      .then(setData)
      .catch((e) => toast(e.message));
  };

  useEffect(() => {
    load();
  }, [filterStatus]);

  const handleUpdateStatus = async (id, status) => {
    let adminNotes;
    if (['REJECTED', 'SUSPENDED', 'REVERSED'].includes(status)) {
      adminNotes = prompt(`Please enter a mandatory reason for setting transfer to ${status}:`);
      if (!adminNotes) {
        toast('Action cancelled: Reason is required.');
        return;
      }
    }

    try {
      await api.admin.updateTransferStatus(id, { status, adminNotes });
      toast(`Transfer status updated to ${status}.`);
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>External Bank Transfer Reviews</h3>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="ALL">All External Transfers</option>
          <option value="PENDING">Pending Review</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved / Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="SUSPENDED">Suspended / Held</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVERSED">Reversed</option>
        </select>
      </div>

      {data.items.length === 0 ? (
        <p className="muted">No external transfers found for this filter.</p>
      ) : (
        data.items.map((t) => {
          const sender = t.senderUser?.profile;
          return (
            <div key={t.id} className="card-box" style={{ marginBottom: 14, padding: 14, background: '#132247' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>Transfer Ref: {t.reference}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Submitted by: {formatName(sender)} ({t.senderUser?.email}) · Date: {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
                <Status>{t.status}</Status>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '12px 0', padding: 10, background: '#0a142f', borderRadius: 6 }}>
                <div><strong>Amount:</strong> <span style={{ color: 'var(--gold)' }}>{money(t.amount, t.currency)}</span> (+{money(t.fee, t.currency)} Fee)</div>
                <div><strong>Destination Bank:</strong> {t.externalBankName || 'N/A'} ({t.externalCountry})</div>
                <div><strong>Recipient Name:</strong> {t.externalAccountName}</div>
                <div><strong>Recipient Account:</strong> {t.externalAccountNum}</div>
                {t.externalRouting && <div><strong>Routing / Sort:</strong> {t.externalRouting || t.externalSortCode}</div>}
                {t.externalSwift && <div><strong>SWIFT / BIC:</strong> {t.externalSwift}</div>}
              </div>

              {t.purpose && <p style={{ fontSize: '0.85rem', margin: '4px 0' }}><strong>Purpose:</strong> {t.purpose}</p>}
              {t.adminNotes && <p style={{ fontSize: '0.85rem', color: '#f59e0b', margin: '4px 0' }}><strong>Reason / Note:</strong> {t.adminNotes}</p>}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {t.status === 'PENDING' && (
                  <Button variant="light" onClick={() => handleUpdateStatus(t.id, 'UNDER_REVIEW')}>Mark Under Review</Button>
                )}
                {['PENDING', 'UNDER_REVIEW'].includes(t.status) && (
                  <Button onClick={() => handleUpdateStatus(t.id, 'APPROVED')}>Approve Transfer</Button>
                )}
                {['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(t.status) && (
                  <Button variant="light" onClick={() => handleUpdateStatus(t.id, 'SUSPENDED')}>Suspend / Hold</Button>
                )}
                {['PENDING', 'UNDER_REVIEW', 'APPROVED'].includes(t.status) && (
                  <Button variant="light" onClick={() => handleUpdateStatus(t.id, 'REJECTED')}>Reject & Refund</Button>
                )}
                {t.status === 'COMPLETED' && (
                  <Button variant="light" onClick={() => handleUpdateStatus(t.id, 'REVERSED')}>Reverse Financial Action</Button>
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

function CryptoAdminTab({ toast }) {
  const [assets, setAssets] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [assetForm, setAssetForm] = useState({
    name: '',
    symbol: '',
    network: '',
    depositAddress: '',
    status: 'ACTIVE',
    instructions: '',
  });

  const load = () => {
    api.admin.cryptoAssets().then(setAssets).catch((e) => toast(e.message));
    api.admin.cryptoDeposits('ALL').then(setDeposits).catch((e) => toast(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    try {
      if (selectedAsset?.id) {
        await api.admin.updateCryptoAsset(selectedAsset.id, assetForm);
        toast('Crypto asset wallet configuration updated.');
      } else {
        await api.admin.createCryptoAsset(assetForm);
        toast('Crypto asset created.');
      }
      setAssetForm({ name: '', symbol: '', network: '', depositAddress: '', status: 'ACTIVE', instructions: '' });
      setSelectedAsset(null);
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleReviewDeposit = async (id, status) => {
    let adminNotes;
    if (['REJECTED', 'SUSPENDED'].includes(status)) {
      adminNotes = prompt(`Please enter a reason for ${status.toLowerCase()}ing this crypto deposit:`);
      if (!adminNotes) return;
    }
    try {
      await api.admin.reviewCryptoDeposit(id, { status, adminNotes });
      toast(`Crypto deposit ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <>
      {/* Wallet Configurations Section */}
      <section className="panel" style={{ marginBottom: 20 }}>
        <h3>Configure Crypto Asset Deposit Addresses</h3>
        <p className="muted">Set up official deposit addresses and networks for supported cryptocurrencies.</p>

        <form onSubmit={handleSaveAsset} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
          <Field label="Asset Name (e.g. Bitcoin)" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} required />
          <Field label="Symbol (e.g. btc)" value={assetForm.symbol} onChange={(e) => setAssetForm({ ...assetForm, symbol: e.target.value })} required />
          <Field label="Network (e.g. Bitcoin / ERC20)" value={assetForm.network} onChange={(e) => setAssetForm({ ...assetForm, network: e.target.value })} required />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Deposit Wallet Address" value={assetForm.depositAddress} onChange={(e) => setAssetForm({ ...assetForm, depositAddress: e.target.value })} required />
          </div>
          <Field label="Instructions (Optional)" value={assetForm.instructions} onChange={(e) => setAssetForm({ ...assetForm, instructions: e.target.value })} />
          <Field label="Status" value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })} select>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="submit">{selectedAsset ? 'Update Asset' : 'Save Configured Asset'}</Button>
          </div>
        </form>

        <div style={{ marginTop: 20 }}>
          <h4>Active Configured Assets</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
            {assets.map((a) => (
              <div key={a.id} style={{ padding: 12, background: '#132247', borderRadius: 8, border: '1px solid var(--border)' }}>
                <strong>{a.name} ({a.symbol.toUpperCase()})</strong>
                <span className={`badge ${a.status === 'ACTIVE' ? 'status-green' : 'status-gray'}`} style={{ marginLeft: 8 }}>{a.status}</span>
                <p style={{ fontSize: '0.8rem', margin: '4px 0', color: 'var(--gold)' }}>Network: {a.network}</p>
                <small className="mono" style={{ wordBreak: 'break-all', display: 'block', fontSize: '0.75rem' }}>{a.depositAddress}</small>
                <Button variant="light" style={{ marginTop: 8 }} onClick={() => { setSelectedAsset(a); setAssetForm(a); }}>Edit Config</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pending Crypto Deposits Reviews */}
      <section className="panel">
        <h3>Pending Crypto Deposit Requests</h3>
        {deposits.length === 0 ? (
          <p className="muted">No crypto deposit requests recorded.</p>
        ) : (
          deposits.map((d) => (
            <div key={d.id} className="card-box" style={{ marginBottom: 12, padding: 12, background: '#132247' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong>Customer: {formatName(d.user?.profile)} ({d.user?.email})</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Asset: {d.asset?.name} ({d.asset?.symbol?.toUpperCase()}) · Network: {d.asset?.network}
                  </div>
                </div>
                <Status>{d.status}</Status>
              </div>

              <div style={{ margin: '8px 0', padding: 8, background: '#0a142f', borderRadius: 6 }}>
                <div><strong>Deposit Amount:</strong> <span style={{ color: 'var(--gold)' }}>{d.amount} {d.asset?.symbol?.toUpperCase()}</span></div>
                {d.txHash && <div><strong>Tx Hash:</strong> <span className="mono">{d.txHash}</span></div>}
                <small className="muted">Requested at: {new Date(d.createdAt).toLocaleString()}</small>
              </div>

              {d.adminNotes && <p style={{ fontSize: '0.85rem', color: '#f59e0b' }}><strong>Reason:</strong> {d.adminNotes}</p>}

              {d.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button onClick={() => handleReviewDeposit(d.id, 'APPROVED')}>Approve & Credit Balance</Button>
                  <Button variant="light" onClick={() => handleReviewDeposit(d.id, 'SUSPENDED')}>Suspend / Hold</Button>
                  <Button variant="light" onClick={() => handleReviewDeposit(d.id, 'REJECTED')}>Reject</Button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </>
  );
}

function Approvals({ toast }) {
  const [q, setQ] = useState({ search: '', status: 'PENDING', page: '1' });
  const [data, setData] = useState({ items: [], total: 0 });
  const load = () => api.admin.applications(q).then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); }, [q.search, q.status, q.page]);

  const handleApprove = async (id) => {
    try {
      await api.admin.approveApplication(id);
      toast('Customer application approved and accounts activated.');
      load();
    } catch (e) { toast(e.message); }
  };

  const handleReject = async (id) => {
    try {
      const reason = prompt('Reason for rejecting account application:');
      if (reason === null) return;
      await api.admin.rejectApplication(id, reason);
      toast('Application rejected.');
      load();
    } catch (e) { toast(e.message); }
  };

  return (
    <section className="panel">
      <h3>Pending Customer Account Applications & KYC Review</h3>
      <div className="admin-controls" style={{ marginBottom: 16 }}>
        <input placeholder="Search name, email, phone, application ID..." value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value, page: '1' })} />
        <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
          <option value="ALL">All Applications</option>
          <option value="PENDING">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {data.items.length === 0 ? <p className="muted">No account applications found.</p> : data.items.map((app) => {
        const prof = app.user?.profile;
        return (
          <div className="card-box" key={app.id} style={{ marginBottom: 14, padding: 14, background: '#132247' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {prof?.photoPath ? (
                  <img src={prof.photoPath} alt="Profile Photo" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--gold)', color: '#09132b', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {prof?.firstName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <strong style={{ fontSize: '1.05rem' }}>{formatName(prof)}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Email: {app.user?.email} · Phone: {prof?.phone || 'N/A'} · App ID: {app.applicationId}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gold)', marginTop: 2 }}>
                    Country: <strong>{prof?.country || 'US'}</strong> · Address: {prof?.address || 'N/A'}, {prof?.city} {prof?.state}
                  </div>
                </div>
              </div>
              <Status>{app.status}</Status>
            </div>

            <div style={{ margin: '12px 0', padding: 10, background: '#0a142f', borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <strong>Identity Type:</strong> {prof?.idType || 'Not Provided'}<br />
                <strong>ID Number:</strong> {prof?.idNumber || 'Not Provided'}
              </div>
              <div>
                {prof?.idDocumentPath ? (
                  <a href={prof.idDocumentPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    📄 View Submitted ID Document ({prof?.idType || 'ID'})
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No ID document attached</span>
                )}
                <br />
                {prof?.photoPath && (
                  <a href={prof.photoPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    📷 View Full Profile Photo / Selfie
                  </a>
                )}
              </div>
            </div>

            {app.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={() => handleApprove(app.id)}>Approve & Activate Account</Button>
                <Button variant="light" onClick={() => handleReject(app.id)}>Reject Application</Button>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function Users({ toast }) {
  const [q, setQ] = useState({ search: '', status: 'ALL' });
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(null);
  const load = () => api.admin.users(q).then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); }, [q.search, q.status]);
  return (
    <>
      <section className="panel">
        <div className="admin-controls">
          <input placeholder="Search users…" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} />
          <select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })}>
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        {data.items.length === 0 ? <p className="muted">No customers found.</p> : data.items.map((u) => (
          <div className="user-row" key={u.id}>
            <span className="avatar">{u.profile?.firstName?.[0]}</span>
            <div>
              <strong>{formatName(u.profile)}</strong>
              <small>{u.email} · {u.accounts?.[0]?.accountNumber}</small>
            </div>
            <Status>{u.status}</Status>
            <div>
              <Button onClick={() => api.admin.user(u.id).then(setSelected)}>Open</Button>
              {u.status === 'ACTIVE' && <Button variant="light" onClick={async () => { await api.admin.suspendUser(u.id); load(); }}>Suspend</Button>}
              {u.status === 'SUSPENDED' && <Button variant="light" onClick={async () => { await api.admin.activateUser(u.id); load(); }}>Activate</Button>}
            </div>
          </div>
        ))}
      </section>
      {selected && <CustomerModal data={selected} onClose={() => { setSelected(null); load(); }} toast={toast} />}
    </>
  );
}

function KycTab({ toast }) {
  const [items, setItems] = useState([]);
  const load = () => api.admin.kycPending().then(setItems).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);

  const verify = async (userId, status) => {
    try {
      const reason = status === 'REJECTED' ? prompt('Reason for rejection') : undefined;
      await api.admin.verifyKyc(userId, { status, reason });
      toast(`KYC status updated to ${status}`);
      load();
    } catch (e) { toast(e.message); }
  };

  return (
    <section className="panel">
      <h3>Pending KYC Applications</h3>
      {items.length === 0 ? <p className="muted">No pending KYC document reviews.</p> : items.map((p) => (
        <div className="user-row" key={p.id} style={{ alignItems: 'flex-start', padding: 12 }}>
          <div>
            <strong>{formatName(p)}</strong>
            <small>{p.user?.email} · ID Type: {p.idType || 'Document'} · No: {p.idNumber || 'N/A'}</small>
            {p.idDocumentPath && (
              <div style={{ marginTop: 8 }}>
                <a href={p.idDocumentPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>
                  📄 View Submitted ID Document ({p.idType || 'ID'})
                </a>
              </div>
            )}
          </div>
          <Status>{p.kycStatus || 'PENDING'}</Status>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => verify(p.userId, 'VERIFIED')}>Approve KYC</Button>
            <Button variant="light" onClick={() => verify(p.userId, 'REJECTED')}>Reject</Button>
          </div>
        </div>
      ))}
    </section>
  );
}

function CustomerModal({ data, onClose, toast }) {
  const [tab, setTab] = useState('Overview');
  const [detail, setDetail] = useState(data.user || data);
  const [amt, setAmt] = useState({ amount: '', reason: 'Admin adjustment', description: 'Funds added', source: 'NEXA' });
  const [savingsAmt, setSavingsAmt] = useState({ amount: '', description: 'Admin Savings Credit', reason: 'Deposit adjustment' });
  const [fdAmt, setFdAmt] = useState({ amount: '', durationMonths: '12', interestRate: '10.0', description: 'Admin Fixed Deposit Creation', reason: 'Fixed deposit adjustment' });

  const [pw, setPw] = useState('');
  const [pin, setPin] = useState('');

  const userId = detail.id || data.user?.id;
  const reload = () => api.admin.customerDetail(userId).then(setDetail);
  useEffect(() => { if (userId) reload(); }, [userId]);

  const checkingAcc = detail.accounts?.find((a) => a.type === 'CHECKING');
  const savingsAcc = detail.accounts?.find((a) => a.type === 'SAVINGS');
  const fdAcc = detail.accounts?.find((a) => a.type === 'FIXED_DEPOSIT');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 850 }}>
        <div className="modal-head">
          <h3>Customer Details: {formatName(detail.profile)}</h3>
          <button onClick={onClose}><I.X /></button>
        </div>

        <div className="tabs">
          {['Overview', 'Profile & KYC', 'Multi-Account Funding', 'Loans & Cards', 'Crypto Wallets', 'Security', 'Audit Logs'].map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          {tab === 'Overview' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><strong>Email:</strong> {detail.email}</div>
                <div><strong>Account Status:</strong> <Status>{detail.status}</Status></div>
                <div><strong>Country:</strong> {detail.profile?.country}</div>
                <div><strong>KYC Status:</strong> <Status>{detail.profile?.kycStatus || 'PENDING'}</Status></div>
              </div>

              <h4 style={{ margin: '12px 0 6px 0', color: 'var(--gold)' }}>Accounts & Product Balances</h4>
              {detail.accounts?.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: '#132247', borderRadius: 6 }}>
                  <span><strong>{a.type}</strong> ({a.accountNumber})</span>
                  <span>{money(a.balance, a.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Profile & KYC' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="First Name" value={detail.profile?.firstName || ''} onChange={(e) => setDetail({ ...detail, profile: { ...detail.profile, firstName: e.target.value } })} />
                <Field label="Last Name" value={detail.profile?.lastName || ''} onChange={(e) => setDetail({ ...detail, profile: { ...detail.profile, lastName: e.target.value } })} />
                <Field label="Phone" value={detail.profile?.phone || ''} onChange={(e) => setDetail({ ...detail, profile: { ...detail.profile, phone: e.target.value } })} />
                <Field label="Address" value={detail.profile?.address || ''} onChange={(e) => setDetail({ ...detail, profile: { ...detail.profile, address: e.target.value } })} />
              </div>
              <Button onClick={async () => { await api.admin.updateUser(detail.id, detail.profile); toast('Profile updated.'); reload(); }}>Save Profile Information</Button>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>KYC Identity Verification</h4>
                <p><strong>ID Type:</strong> {detail.profile?.idType || 'Not Provided'}</p>
                <p><strong>ID Number:</strong> {detail.profile?.idNumber || 'Not Provided'}</p>
                {detail.profile?.idDocumentPath && (
                  <p><a href={detail.profile.idDocumentPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>📄 View ID Document</a></p>
                )}
                {detail.profile?.photoPath && (
                  <p><a href={detail.profile.photoPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>📷 View Profile Photo / Selfie</a></p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Button onClick={async () => { await api.admin.verifyKyc(detail.id, { status: 'VERIFIED' }); toast('KYC Verified.'); reload(); }}>Approve KYC</Button>
                  <Button variant="light" onClick={async () => { const reason = prompt('Rejection reason'); await api.admin.verifyKyc(detail.id, { status: 'REJECTED', reason }); toast('KYC Rejected.'); reload(); }}>Reject KYC</Button>
                </div>
              </div>
            </div>
          )}

          {tab === 'Multi-Account Funding' && (
            <div style={{ display: 'grid', gap: 20 }}>
              {checkingAcc && (
                <div style={{ background: '#132247', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>💳 Fund Checking / Main Account ({checkingAcc.accountNumber})</h4>
                  <p>Current Balance: <strong>{money(checkingAcc.balance, checkingAcc.currency)}</strong></p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Amount" type="number" value={amt.amount} onChange={(e) => setAmt({ ...amt, amount: e.target.value })} />
                    <Field label="Reason" value={amt.reason} onChange={(e) => setAmt({ ...amt, reason: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button onClick={async () => { await api.admin.addFunds(checkingAcc.id, { ...amt, amount: Number(amt.amount) }); toast('Checking funded.'); reload(); }}>Credit Checking</Button>
                    <Button variant="light" onClick={async () => { await api.admin.removeFunds(checkingAcc.id, { ...amt, amount: Number(amt.amount) }); toast('Checking debited.'); reload(); }}>Debit Checking</Button>
                  </div>
                </div>
              )}

              {savingsAcc && (
                <div style={{ background: '#132247', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>🐷 Fund Savings Account ({savingsAcc.accountNumber})</h4>
                  <p>Current Savings Balance: <strong>{money(savingsAcc.balance, savingsAcc.currency)}</strong></p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="Amount" type="number" value={savingsAmt.amount} onChange={(e) => setSavingsAmt({ ...savingsAmt, amount: e.target.value })} />
                    <Field label="Reason" value={savingsAmt.reason} onChange={(e) => setSavingsAmt({ ...savingsAmt, reason: e.target.value })} />
                  </div>
                  <Button style={{ marginTop: 8 }} onClick={async () => { await api.admin.fundSavings(savingsAcc.id, { ...savingsAmt, amount: Number(savingsAmt.amount) }); toast('Savings account funded.'); reload(); }}>Fund Savings Account</Button>
                </div>
              )}

              {fdAcc && (
                <div style={{ background: '#132247', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>🔒 Fund / Create Fixed Deposit ({fdAcc.accountNumber})</h4>
                  <p>Current Fixed Deposit Balance: <strong>{money(fdAcc.balance, fdAcc.currency)}</strong></p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <Field label="Amount" type="number" value={fdAmt.amount} onChange={(e) => setFdAmt({ ...fdAmt, amount: e.target.value })} />
                    <Field label="Duration (Months)" value={fdAmt.durationMonths} onChange={(e) => setFdAmt({ ...fdAmt, durationMonths: e.target.value })} select>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                    </Field>
                    <Field label="Interest Rate %" type="number" value={fdAmt.interestRate} onChange={(e) => setFdAmt({ ...fdAmt, interestRate: e.target.value })} />
                  </div>
                  <Button style={{ marginTop: 8 }} onClick={async () => { await api.admin.fundFixedDeposit(fdAcc.id, { ...fdAmt, amount: Number(fdAmt.amount), durationMonths: Number(fdAmt.durationMonths), interestRate: Number(fdAmt.interestRate) }); toast('Fixed Deposit funded.'); reload(); }}>Fund Fixed Deposit</Button>
                </div>
              )}
            </div>
          )}

          {tab === 'Loans & Cards' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>Loans ({detail.loans?.length || 0})</h4>
                {detail.loanApplications?.map((l) => (
                  <div key={l.id} style={{ padding: 10, background: '#132247', borderRadius: 6, marginBottom: 8 }}>
                    <div><strong>{l.purpose}</strong> ({money(l.amount)}) — <Status>{l.status}</Status></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Family Ref: {l.familyContactName} ({l.familyContactRelationship} - {l.familyContactPhone})<br />
                      Friend Ref: {l.friendContactName} ({l.friendContactRelationship} - {l.friendContactPhone})
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--gold)' }}>Issued Debit Cards ({detail.cards?.length || 0})</h4>
                {detail.cards?.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: '#132247', borderRadius: 6, marginBottom: 8 }}>
                    <div><strong>{c.type} Card</strong> ({c.cardNumber}) — Exp: {c.expiryMonth}/{c.expiryYear}</div>
                    <Status>{c.status}</Status>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Crypto Wallets' && (
            <CustomerCryptoWalletsTab userId={detail.id} wallets={detail.cryptoWallets || []} reload={reload} toast={toast} />
          )}

          {tab === 'Security' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <p>PIN Status: Enabled ({String(detail.pinCredential?.enabled)}) · Locked ({String(detail.pinCredential?.locked)})</p>
              <Field label="Reset Account Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
              <Button onClick={async () => { await api.admin.resetPassword(detail.id, pw); toast('Password updated.'); setPw(''); }}>Set New Password</Button>

              <Field label="Reset 4-Digit PIN" type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} />
              <Button onClick={async () => { await api.admin.resetPin(detail.id, pin); toast('PIN reset required.'); setPin(''); }}>Set Temporary PIN</Button>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button variant="light" onClick={async () => { await api.admin.pinState(detail.id, { locked: true }); toast('PIN locked.'); reload(); }}>Lock PIN</Button>
                <Button variant="light" onClick={async () => { await api.admin.pinState(detail.id, { locked: false }); toast('PIN unlocked.'); reload(); }}>Unlock PIN</Button>
              </div>
            </div>
          )}

          {tab === 'Audit Logs' && (
            <div>
              {detail.auditLogs?.length === 0 ? <p className="muted">No audit events recorded.</p> : detail.auditLogs?.map((a) => (
                <div key={a.id} style={{ padding: 8, borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <strong>{a.action}</strong> <span style={{ color: 'var(--text-muted)' }}>({new Date(a.createdAt).toLocaleString()})</span>
                  <div>{a.reason || 'No description'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerCryptoWalletsTab({ userId, wallets = [], reload, toast }) {
  const [wForm, setWForm] = useState({
    symbol: 'btc',
    network: 'Bitcoin',
    depositAddress: '',
    status: 'ACTIVE',
  });

  const [editingWallet, setEditingWallet] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.admin.updateCustomerCryptoWallet(userId, wForm);
      toast(`Customer ${wForm.symbol.toUpperCase()} wallet saved.`);
      setWForm({ symbol: 'btc', network: 'Bitcoin', depositAddress: '', status: 'ACTIVE' });
      setEditingWallet(null);
      reload();
    } catch (err) {
      toast(err.message);
    }
  };

  const handleDelete = async (walletId) => {
    if (!confirm('Are you sure you want to remove this wallet for this customer?')) return;
    try {
      await api.admin.deleteCustomerCryptoWallet(userId, walletId);
      toast('Customer crypto wallet removed.');
      reload();
    } catch (err) {
      toast(err.message);
    }
  };

  const selectSymbol = (sym) => {
    const networks = { btc: 'Bitcoin', eth: 'Ethereum', usdt: 'ERC20', sol: 'Solana', bnb: 'BSC (BEP20)' };
    const existing = wallets.find((w) => w.symbol.toLowerCase() === sym);
    if (existing) {
      setEditingWallet(existing);
      setWForm(existing);
    } else {
      setEditingWallet(null);
      setWForm({ symbol: sym, network: networks[sym] || 'Mainnet', depositAddress: '', status: 'ACTIVE' });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: '#132247', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 4px 0', color: 'var(--gold)' }}>🔑 Individual Customer Crypto Wallets</h4>
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          Configure unique deposit addresses assigned specifically to this customer.
        </p>

        {/* Quick Symbol Selector */}
        <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
          {['btc', 'eth', 'usdt', 'sol', 'bnb'].map((sym) => {
            const hasWallet = wallets.some((w) => w.symbol.toLowerCase() === sym);
            const isSel = wForm.symbol === sym;
            return (
              <button
                key={sym}
                type="button"
                className={`btn ${isSel ? 'primary' : 'outline'}`}
                onClick={() => selectSymbol(sym)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                {sym.toUpperCase()} {hasWallet ? '✓' : ''}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Asset Symbol" value={wForm.symbol} onChange={(e) => setWForm({ ...wForm, symbol: e.target.value.toLowerCase() })} select>
              <option value="btc">BTC (Bitcoin)</option>
              <option value="eth">ETH (Ethereum)</option>
              <option value="usdt">USDT (Tether)</option>
              <option value="sol">SOL (Solana)</option>
              <option value="bnb">BNB (Binance)</option>
            </Field>

            <Field label="Network" value={wForm.network} onChange={(e) => setWForm({ ...wForm, network: e.target.value })} required />
          </div>

          <Field label="Customer's Unique Wallet Address" value={wForm.depositAddress} onChange={(e) => setWForm({ ...wForm, depositAddress: e.target.value })} required />

          <Field label="Wallet Status" value={wForm.status} onChange={(e) => setWForm({ ...wForm, status: e.target.value })} select>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button type="submit">{editingWallet ? 'Update Customer Wallet' : 'Assign Wallet Address'}</Button>
          </div>
        </form>
      </div>

      {/* Configured Wallets List for this Customer */}
      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Current Assigned Wallets ({wallets.length})</h4>
        {wallets.length === 0 ? (
          <p className="muted">No individual crypto wallets configured for this customer yet.</p>
        ) : (
          wallets.map((w) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#132247', borderRadius: 6, marginBottom: 8, border: '1px solid var(--border)' }}>
              <div>
                <strong>{w.symbol.toUpperCase()} Wallet</strong> <span className={`badge ${w.status === 'ACTIVE' ? 'status-green' : 'status-gray'}`} style={{ fontSize: 10 }}>{w.status}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Network: {w.network}</div>
                <small className="mono" style={{ wordBreak: 'break-all', display: 'block' }}>{w.depositAddress}</small>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="light" onClick={() => { setEditingWallet(w); setWForm(w); }}>Edit</Button>
                <Button variant="light" onClick={() => handleDelete(w.id)}>Remove</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CreateCustomer({ toast, onDone }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', country: 'US', password: '', pin: '0000', openingBalance: 0, status: 'ACTIVE', accountType: 'CHECKING' });
  return (
    <section className="panel create-customer-form">
      {['firstName', 'lastName', 'email', 'phone'].map((k) => (
        <Field key={k} label={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ))}
      <Field label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} select options={countries} />
      <Field label="Initial password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <Field label="Initial PIN" type="password" maxLength={4} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
      <Field label="Opening balance" type="number" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} />
      <Button onClick={async () => {
        try {
          await api.admin.createUser({ ...form, openingBalance: Number(form.openingBalance) });
          toast('Customer created.');
          onDone();
        } catch (e) { toast(e.message); }
      }}>Create customer</Button>
    </section>
  );
}

function AccountsTab({ toast }) {
  const [users, setUsers] = useState({ items: [] });
  useEffect(() => { api.admin.users({ status: 'ALL' }).then(setUsers).catch((e) => toast(e.message)); }, []);
  return (
    <section className="panel">
      {users.items.length === 0 ? <p className="muted">No accounts yet.</p> : users.items.map((u) => (
        <div className="user-row" key={u.id}>
          <div><strong>{formatName(u.profile)}</strong><small>{u.accounts?.map((a) => a.accountNumber).join(' · ')}</small></div>
          <strong>{money(u.accounts?.reduce((s, a) => s + a.balance, 0) || 0, u.accounts?.[0]?.currency)}</strong>
        </div>
      ))}
    </section>
  );
}

function TransactionsTab({ toast }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 5);

  const [q, setQ] = useState({ search: '', status: 'ALL', type: 'ALL' });
  const [data, setData] = useState({ items: [] });
  const [users, setUsers] = useState({ items: [] });
  const [form, setForm] = useState({
    userId: '', accountId: '', type: 'DEPOSIT', amount: '', currency: 'USD', direction: 'CREDIT',
    description: '', senderName: '', recipientName: '', transactionDate: todayStr, transactionTime: timeStr,
  });

  const load = () => api.admin.transactions(q).then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); api.admin.users({}).then(setUsers); }, [q.search, q.status, q.type]);
  const selectedUser = users.items.find((u) => u.id === form.userId);

  const handleAccountSelect = (accId) => {
    const acc = selectedUser?.accounts?.find((a) => a.id === accId);
    setForm({ ...form, accountId: accId, currency: acc?.currency || 'USD' });
  };

  const handleCreate = async () => {
    try {
      await api.admin.createArbitraryTransaction({
        ...form,
        amount: Number(form.amount),
      });
      toast('Transaction recorded successfully.');
      setForm((f) => ({ ...f, amount: '', description: '' }));
      load();
    } catch (e) { toast(e.message); }
  };

  return (
    <>
      <section className="panel">
        <h3>Create / Backdate Transaction</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Customer" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value, accountId: '' })} select>
            <option value="">Select Customer</option>
            {users.items.map((u) => <option key={u.id} value={u.id}>{formatName(u.profile)} ({u.email})</option>)}
          </Field>
          <Field label="Account" value={form.accountId} onChange={(e) => handleAccountSelect(e.target.value)} select>
            <option value="">Select Account</option>
            {selectedUser?.accounts?.map((a) => <option key={a.id} value={a.id}>{a.accountNumber} ({a.type} - {a.currency})</option>)}
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} select>
            {['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT', 'REFUND', 'INTEREST', 'FEE', 'ADJUSTMENT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SAVINGS_TRANSFER', 'SAVINGS_FUNDING', 'FIXED_DEPOSIT_FUNDING', 'CARD_TRANSACTION', 'CARD_FEE', 'REVERSAL'].map((t) => <option key={t}>{t}</option>)}
          </Field>
          <Field label="Direction" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} select>
            <option value="CREDIT">CREDIT (+)</option>
            <option value="DEBIT">DEBIT (-)</option>
          </Field>
          <Field label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} select>
            {['USD', 'EUR', 'GBP', 'NGN', 'AUD', 'CAD', 'INR', 'ZAR', 'KES', 'GHS'].map((c) => <option key={c}>{c}</option>)}
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Field label="Transaction Date" type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
          <Field label="Transaction Time" type="time" value={form.transactionTime} onChange={(e) => setForm({ ...form, transactionTime: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="From (Sender Name)" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
          <Field label="To (Recipient Name)" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
        </div>

        <Field label="Description / Reason" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <Button onClick={handleCreate} style={{ marginTop: 8 }}>Record Transaction</Button>
      </section>

      <section className="panel">
        <div className="admin-controls">
          <input placeholder="Search transactions…" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} />
        </div>
        {data.items.length === 0 ? <p className="muted">No transactions.</p> : data.items.map((t) => (
          <div className="transaction-row" key={t.id}>
            <div>
              <strong>{t.reference}</strong>
              <small>{t.type} · {t.description || 'No desc'} · {t.user?.email} · Date: {new Date(t.transactionDate || t.createdAt).toLocaleString()}</small>
            </div>
            <b>{money(t.amount, t.currency)}</b>
          </div>
        ))}
      </section>
    </>
  );
}

function TransfersTab({ toast }) {
  const [data, setData] = useState({ items: [] });
  const [users, setUsers] = useState({ items: [] });
  const [inc, setInc] = useState({ accountId: '', amount: '', currency: 'USD', senderName: '', senderBank: '', description: '' });
  const load = () => api.admin.transfers({}).then(setData).catch((e) => toast(e.message));
  useEffect(() => { load(); api.admin.users({}).then(setUsers); }, []);
  return (
    <>
      <section className="panel">
        <h3>Record incoming funds</h3>
        <Field label="Recipient account" value={inc.accountId} onChange={(e) => setInc({ ...inc, accountId: e.target.value })} select>
          <option value="">Select</option>
          {users.items.flatMap((u) => (u.accounts || []).map((a) => <option key={a.id} value={a.id}>{formatName(u.profile)} · {a.accountNumber}</option>))}
        </Field>
        <Field label="Amount" type="number" value={inc.amount} onChange={(e) => setInc({ ...inc, amount: e.target.value })} />
        <Field label="Sender name" value={inc.senderName} onChange={(e) => setInc({ ...inc, senderName: e.target.value })} />
        <Field label="Sender bank" value={inc.senderBank} onChange={(e) => setInc({ ...inc, senderBank: e.target.value })} />
        <Button onClick={async () => { try { await api.admin.incomingFunds({ ...inc, amount: Number(inc.amount) }); toast('Incoming funds recorded.'); load(); } catch (e) { toast(e.message); } }}>Credit account</Button>
      </section>
      <section className="panel">
        {data.items.length === 0 ? <p className="muted">No transfers.</p> : data.items.map((t) => (
          <div className="user-row" key={t.id}>
            <div><strong>{t.reference}</strong><small>{t.type} · {money(t.amount, t.currency)}</small></div>
            <Status>{t.status}</Status>
            {t.type === 'EXTERNAL' && t.status !== 'COMPLETED' && t.status !== 'REJECTED' && (
              <div>
                {['UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((s) => (
                  <Button key={s} variant="light" onClick={async () => { await api.admin.updateTransferStatus(t.id, { status: s }); load(); }}>{s.replace('_', ' ')}</Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}

function LoansTab({ toast }) {
  const [apps, setApps] = useState([]);
  const load = () => api.admin.loanApplications().then(setApps).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.admin.approveLoan(id);
      toast('Loan approved & funds disbursed.');
      load();
    } catch (e) { toast(e.message); }
  };

  const handleReject = async (id) => {
    try {
      const reason = prompt('Reason for loan rejection:');
      if (reason === null) return;
      await api.admin.rejectLoan(id, reason);
      toast('Loan application rejected.');
      load();
    } catch (e) { toast(e.message); }
  };

  return (
    <section className="panel">
      <h3>Loan Applications & Verification Queue</h3>
      {apps.length === 0 ? <p className="muted">No loan applications pending review.</p> : apps.map((a) => (
        <div className="card-box" key={a.id} style={{ marginBottom: 14, padding: 14, background: '#132247' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {a.user?.profile?.photoPath ? (
                <img src={a.user.profile.photoPath} alt="Applicant Avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', color: '#09132b', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
                  {a.user?.profile?.firstName?.[0] || 'U'}
                </div>
              )}
              <div>
                <strong>{formatName(a.user?.profile)}</strong> ({a.user?.email})
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Country: {a.user?.profile?.country || 'US'} · Status: {a.employmentStatus || 'N/A'} (Est. Income: {money(a.monthlyIncome || 0, a.currency)})
                </div>
              </div>
            </div>
            <Status>{a.status}</Status>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '12px 0', padding: 10, background: '#0a142f', borderRadius: 6 }}>
            <div><strong>Requested Amount:</strong> <span style={{ color: 'var(--gold)' }}>{money(a.amount, a.currency)}</span></div>
            <div><strong>Duration / Term:</strong> {a.duration} Months</div>
            <div><strong>Loan Purpose:</strong> {a.purpose}</div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            <div>👨‍👩‍👧 <strong>Family Emergency Ref:</strong> {a.familyContactName || 'N/A'} ({a.familyContactRelationship} - {a.familyContactPhone})</div>
            <div>🤝 <strong>Friend Emergency Ref:</strong> {a.friendContactName || 'N/A'} ({a.friendContactRelationship} - {a.friendContactPhone})</div>
          </div>

          {a.idDocumentPath && (
            <div style={{ marginBottom: 10 }}>
              <a href={a.idDocumentPath} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600 }}>
                📄 View Submitted Loan Identification Document ({a.idType || 'ID'})
              </a>
            </div>
          )}

          {a.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button onClick={() => handleApprove(a.id)}>Approve Loan & Disburse</Button>
              <Button variant="light" onClick={() => handleReject(a.id)}>Reject Application</Button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function CardsTab({ toast }) {
  const [reqs, setReqs] = useState([]);
  const load = () => api.admin.cardRequests().then(setReqs).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);
  return (
    <section className="panel">
      {reqs.length === 0 ? <p className="muted">No card requests.</p> : reqs.map((r) => (
        <div className="user-row" key={r.id}>
          <div><strong>{r.cardType}</strong><small>{formatName(r.user?.profile)}</small></div>
          <Status>{r.status}</Status>
          {r.status === 'PENDING' && (
            <div>
              <Button onClick={async () => { await api.admin.issueCard(r.id); toast('Card issued.'); load(); }}>Issue</Button>
              <Button variant="light" onClick={async () => { await api.admin.rejectCard(r.id, 'Not approved'); load(); }}>Reject</Button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function ReportsTab({ toast }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.admin.reports({}).then(setRep).catch((e) => toast(e.message)); }, []);
  if (!rep) return <p className="muted">Loading…</p>;
  return (
    <section className="panel report-grid">
      {Object.entries(rep).map(([k, v]) => <article key={k}><p>{k}</p><h2>{v}</h2></article>)}
    </section>
  );
}

function AuditTab({ toast }) {
  const [q, setQ] = useState({ search: '' });
  const [data, setData] = useState({ items: [] });
  useEffect(() => { api.admin.auditLogs(q).then(setData).catch((e) => toast(e.message)); }, [q.search]);
  return (
    <section className="panel">
      <input placeholder="Search audit logs…" value={q.search} onChange={(e) => setQ({ search: e.target.value })} />
      {data.items.length === 0 ? <p className="muted">No audit entries.</p> : data.items.map((e) => (
        <div className="audit-row" key={e.id}>
          <span className="audit-action">{e.action}</span>
          <span>{e.actor?.email}</span>
          <span>{e.targetType} {e.targetId}</span>
          <span>{new Date(e.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </section>
  );
}

function AdminNotifs({ toast }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api.admin.notifications().then(setItems).catch((e) => toast(e.message)); }, []);
  return (
    <section className="panel">
      {items.length === 0 ? <p className="muted">No notifications.</p> : items.map((n) => (
        <div key={n.id} className="notification-item"><div><strong>{n.title}</strong><p>{n.message}</p></div></div>
      ))}
    </section>
  );
}

function SupportTab({ toast }) {
  const [tickets, setTickets] = useState([]);
  const [replies, setReplies] = useState({});
  const load = () => api.admin.support().then(setTickets).catch((e) => toast(e.message));
  useEffect(() => { load(); }, []);

  const handleSendReply = async (ticketId) => {
    const msg = replies[ticketId];
    if (!msg?.trim()) return;
    try {
      await api.admin.supportReply(ticketId, msg);
      toast('Reply sent to customer.');
      setReplies({ ...replies, [ticketId]: '' });
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await api.admin.supportStatus(ticketId, status);
      toast(`Ticket status changed to ${status}.`);
      load();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <section className="panel">
      <h3>Customer Support Conversations</h3>
      {tickets.length === 0 ? (
        <p className="muted">No support tickets found.</p>
      ) : (
        tickets.map((t) => (
          <div key={t.id} className="card-box" style={{ marginBottom: 16, padding: 14, background: '#132247' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{t.subject}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  From: {formatName(t.user?.profile)} ({t.user?.email}) · Category: <span className="badge-inline">{t.category || 'General'}</span> · Date: {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 4, background: '#0a142f', color: '#fff', border: '1px solid var(--border)' }}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div style={{ margin: '10px 0', padding: 10, background: '#0a142f', borderRadius: 6 }}>
              <small className="muted">Initial Customer Query:</small>
              <p style={{ margin: '4px 0 0 0' }}>{t.message}</p>
            </div>

            {/* Existing replies thread */}
            {(t.replies || []).length > 0 && (
              <div style={{ margin: '10px 0', paddingLeft: 10, borderLeft: '2px solid var(--gold)' }}>
                <small className="muted">Conversation Thread:</small>
                {t.replies.map((r) => (
                  <div key={r.id} style={{ marginTop: 6, fontSize: '0.9rem' }}>
                    <strong>{r.isAdmin ? '✦ Admin Reply' : 'Customer Reply'}:</strong> {r.message}
                    <small className="muted" style={{ display: 'block', fontSize: '0.75rem' }}>{new Date(r.createdAt).toLocaleString()}</small>
                  </div>
                ))}
              </div>
            )}

            {/* Admin reply input */}
            {['OPEN', 'IN_PROGRESS'].includes(t.status) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Write response to customer..."
                  value={replies[t.id] || ''}
                  onChange={(e) => setReplies({ ...replies, [t.id]: e.target.value })}
                  style={{ flex: 1 }}
                />
                <Button onClick={() => handleSendReply(t.id)}>Send Reply</Button>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}

function SettingsTab({ toast }) {
  const [s, setS] = useState(null);
  useEffect(() => { api.admin.settings().then(setS); }, []);
  if (!s) return <p className="muted">Loading…</p>;
  return (
    <section className="panel settings-grid">
      {Object.entries(s).map(([k, v]) => (
        <Field key={k} label={k} value={v} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      ))}
      <Button onClick={async () => { await api.admin.updateSettings(s); toast('Settings saved.'); }}>Save settings</Button>
    </section>
  );
}
