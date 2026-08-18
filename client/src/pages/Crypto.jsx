import { useEffect, useState } from 'react';
import PageIntro from '../components/PageIntro';
import LiveSparkline from '../components/LiveSparkline';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import * as I from 'lucide-react';

export default function Crypto() {
  const [market, setMarket] = useState([]);
  const [assets, setAssets] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [timeRange, setTimeRange] = useState('1W');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadData = () => {
    api.crypto.market().then((m) => {
      setMarket(m);
      if (m.length > 0 && !selectedCoin) {
        setSelectedCoin(m[0]);
      }
    }).catch((e) => toast(e.message));

    api.crypto.assets().then(setAssets).catch(() => {});
    api.crypto.deposits().then(setDeposits).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAssetConfig = assets.find(
    (a) => a.symbol.toLowerCase() === selectedCoin?.symbol?.toLowerCase()
  );

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssetConfig) {
      toast('Deposit address is not configured for this asset yet.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast('Please enter a valid amount.');
      return;
    }
    setSubmitting(true);
    try {
      await api.crypto.depositRequest({
        assetId: activeAssetConfig.id,
        amount: Number(amount),
        txHash,
      });
      toast('Crypto deposit request submitted successfully!');
      setShowDepositModal(false);
      setAmount('');
      setTxHash('');
      loadData();
    } catch (err) {
      toast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract graph price points for sparkline
  const sparklinePrices = selectedCoin?.sparkline_in_7d?.price || [100, 105, 102, 108, 115, 112, 120];

  return (
    <>
      <PageIntro
        title="Crypto Market & Wallet"
        text="View real-time crypto prices, inspect asset details, and make deposit requests."
      />

      {/* Selected Asset Interactive Hero / Chart */}
      {selectedCoin && (
        <div className="panel crypto-hero-panel" style={{ marginBottom: 20 }}>
          <div className="crypto-hero-header">
            <div className="coin-meta">
              <img src={selectedCoin.image} alt={selectedCoin.name} width={36} height={36} />
              <div>
                <h2>{selectedCoin.name} <span className="symbol">{selectedCoin.symbol?.toUpperCase()}</span></h2>
                <span className="price-tag">${Number(selectedCoin.current_price || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="coin-change">
              <span className={`badge ${selectedCoin.price_change_percentage_24h >= 0 ? 'status-green' : 'status-red'}`}>
                {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}
                {Number(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
              </span>
            </div>
          </div>

          {/* Interactive Chart Controls */}
          <div className="chart-wrapper" style={{ marginTop: 20, marginBottom: 15 }}>
            <div className="chart-toolbar">
              {['1H', '1D', '1W', '1M', '1Y'].map((range) => (
                <button
                  key={range}
                  className={`btn-xs ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            <div style={{ width: '100%', height: 120, paddingTop: 10 }}>
              <LiveSparkline
                color={selectedCoin.price_change_percentage_24h >= 0 ? '#10b981' : '#ef4444'}
                gradientId={`spark-coin-${selectedCoin.id}`}
                initialValues={sparklinePrices.slice(-16)}
                height={120}
                width={600}
              />
            </div>
          </div>

          {/* Asset Deposit Action / Wallet info */}
          <div className="crypto-action-bar">
            {activeAssetConfig ? (
              <div className="wallet-info-card">
                <div>
                  <small className="muted">Configured {activeAssetConfig.network} Network Deposit Address:</small>
                  <p className="mono-address">{activeAssetConfig.depositAddress}</p>
                </div>
                <button className="btn primary" onClick={() => setShowDepositModal(true)}>
                  <I.ArrowDownCircle size={16} /> Deposit {selectedCoin.symbol?.toUpperCase()}
                </button>
              </div>
            ) : (
              <div className="wallet-info-card muted-box">
                <small className="muted">Admin wallet deposit address for {selectedCoin.name} is currently pending setup.</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market Assets List */}
      <h3 className="section-title">Cryptocurrency Assets</h3>
      <section className="panel" style={{ marginTop: 10 }}>
        {market.length === 0 ? (
          <p className="muted">Loading crypto market data...</p>
        ) : (
          market.map((coin) => {
            const isSelected = selectedCoin?.id === coin.id;
            const up = (coin.price_change_percentage_24h || 0) >= 0;
            return (
              <div
                className={`crypto clickable-row ${isSelected ? 'selected-coin-row' : ''}`}
                key={coin.id}
                onClick={() => setSelectedCoin(coin)}
                style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 8 }}
              >
                <b className="coin">
                  <img src={coin.image} alt="" width={28} height={28} />
                </b>
                <div>
                  <strong>{coin.name}</strong>
                  <small style={{ marginLeft: 6 }}>{coin.symbol.toUpperCase()}</small>
                </div>
                <strong style={{ marginLeft: 'auto', marginRight: 15 }}>
                  ${Number(coin.current_price).toLocaleString()}
                </strong>
                <em className={up ? 'positive' : 'negative'}>
                  {up ? '+' : ''}{Number(coin.price_change_percentage_24h || 0).toFixed(2)}%
                </em>
              </div>
            );
          })
        )}
      </section>

      {/* Deposit Requests History */}
      {deposits.length > 0 && (
        <div style={{ marginTop: 25 }}>
          <h3 className="section-title">Crypto Deposit History</h3>
          <section className="panel" style={{ marginTop: 10 }}>
            {deposits.map((d) => (
              <div key={d.id} className="transaction-row">
                <div>
                  <strong>Deposit {d.asset?.name || 'Crypto'} ({d.asset?.symbol?.toUpperCase()})</strong>
                  <small>{new Date(d.createdAt).toLocaleString()} · {d.txHash ? `Hash: ${d.txHash.slice(0, 10)}...` : 'Direct Request'}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b>+{d.amount} {d.asset?.symbol?.toUpperCase()}</b>
                  <br />
                  <span className={`badge status-${d.status?.toLowerCase()}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* Crypto Deposit Request Modal */}
      {showDepositModal && activeAssetConfig && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Deposit {activeAssetConfig.name} ({activeAssetConfig.symbol.toUpperCase()})</h3>
            <p className="muted">Please send funds only on the <strong>{activeAssetConfig.network}</strong> network to the address below:</p>
            
            <div className="deposit-address-box" style={{ background: 'var(--bg-secondary, #1e293b)', padding: 12, borderRadius: 8, margin: '15px 0' }}>
              <small className="muted">Official Deposit Address</small>
              <p className="mono" style={{ wordBreak: 'break-all', fontWeight: 'bold', marginTop: 4 }}>
                {activeAssetConfig.depositAddress}
              </p>
              {activeAssetConfig.instructions && (
                <small className="text-warning" style={{ display: 'block', marginTop: 8 }}>
                  Note: {activeAssetConfig.instructions}
                </small>
              )}
            </div>

            <form onSubmit={handleDepositSubmit}>
              <div className="field-group">
                <label>Amount Sent ({activeAssetConfig.symbol.toUpperCase()})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 0.05"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="field-group" style={{ marginTop: 12 }}>
                <label>Transaction Hash / TxID (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste blockchain transaction hash"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn outline" onClick={() => setShowDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
