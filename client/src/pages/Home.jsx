import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as I from 'lucide-react';
import Logo from '../components/Logo';
import LiveSparkline from '../components/LiveSparkline';

export default function Home() {
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cryptoAssets = [
    {
      id: 'btc',
      name: 'Bitcoin',
      pair: 'BTC / USD',
      price: '$68,432.21',
      change: '↑ 2.45%',
      isPositive: true,
      color: '#f97316',
      gradientId: 'spark-btc',
      values: [35, 42, 38, 52, 48, 65, 60, 78, 72, 88, 82, 92, 85, 96],
      icon: (
        <div className="crypto-icon-badge btc-badge">
          <span>₿</span>
        </div>
      ),
    },
    {
      id: 'eth',
      name: 'Ethereum',
      pair: 'ETH / USD',
      price: '$3,451.32',
      change: '↑ 1.89%',
      isPositive: true,
      color: '#3b82f6',
      gradientId: 'spark-eth',
      values: [30, 45, 35, 60, 50, 70, 62, 85, 75, 90, 80, 95],
      icon: (
        <div className="crypto-icon-badge eth-badge">
          <span>Ξ</span>
        </div>
      ),
    },
    {
      id: 'usdt',
      name: 'Tether',
      pair: 'USDT / USD',
      price: '$1.00',
      change: '→ 0.00%',
      isPositive: true,
      color: '#10b981',
      gradientId: 'spark-usdt',
      values: [50, 49, 51, 50, 50, 51, 49, 50, 50, 51, 50, 50],
      icon: (
        <div className="crypto-icon-badge usdt-badge">
          <span>₮</span>
        </div>
      ),
    },
    {
      id: 'sol',
      name: 'Solana',
      pair: 'SOL / USD',
      price: '$156.78',
      change: '↑ 3.12%',
      isPositive: true,
      color: '#a855f7',
      gradientId: 'spark-sol',
      values: [25, 40, 32, 58, 52, 68, 64, 82, 76, 94, 88, 98],
      icon: (
        <div className="crypto-icon-badge sol-badge">
          <span>S</span>
        </div>
      ),
    },
  ];

  const features = [
    {
      title: 'Global Transfers',
      desc: 'Send & receive money worldwide instantly',
      icon: I.Globe2,
      colorClass: 'icon-blue',
    },
    {
      title: 'Multi-Currency',
      desc: 'Hold and manage 20+ currencies',
      icon: I.RefreshCw,
      colorClass: 'icon-green',
    },
    {
      title: 'Secure & Trusted',
      desc: 'Bank-level security you can count on',
      icon: I.ShieldCheck,
      colorClass: 'icon-cyan',
    },
    {
      title: 'Smart Savings',
      desc: 'Grow your money with better interest',
      icon: I.TrendingUp,
      colorClass: 'icon-purple',
    },
  ];

  return (
    <div className="nexa-homepage">
      {/* Background Radial Ambient Glows */}
      <div className="glow-bg glow-1"></div>
      <div className="glow-bg glow-2"></div>
      <div className="glow-bg glow-3"></div>

      {/* TOP NAVIGATION BAR */}
      <header className="nexa-navbar">
        <div className="nav-container">
          {/* Desktop Left / Mobile Left Hamburger */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <I.X size={24} /> : <I.Menu size={24} />}
          </button>

          {/* Logo */}
          <div className="nav-logo-wrapper" onClick={() => nav('/')}>
            <Logo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav-links">
            <a href="#personal" onClick={(e) => { e.preventDefault(); nav('/register'); }}>Personal</a>
            <a href="#business" onClick={(e) => { e.preventDefault(); nav('/register'); }}>Business</a>
            <a href="#crypto" onClick={(e) => { e.preventDefault(); nav('/login'); }}>Crypto</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); }}>About Us</a>
            <a href="#help" onClick={(e) => { e.preventDefault(); }}>Help</a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="desktop-nav-actions">
            <button type="button" className="nav-signin-btn" onClick={() => nav('/login')}>
              Sign in
            </button>
            <button type="button" className="nav-open-btn" onClick={() => nav('/register')}>
              Open an account
            </button>
          </div>

          {/* Mobile Right Notification Bell */}
          <button type="button" className="mobile-bell-btn" onClick={() => nav('/login')}>
            <I.Bell size={20} />
          </button>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <Logo />
                <button type="button" onClick={() => setMobileMenuOpen(false)}><I.X size={22} /></button>
              </div>
              <nav className="mobile-drawer-links">
                <a href="#personal" onClick={() => { setMobileMenuOpen(false); nav('/register'); }}>Personal</a>
                <a href="#business" onClick={() => { setMobileMenuOpen(false); nav('/register'); }}>Business</a>
                <a href="#crypto" onClick={() => { setMobileMenuOpen(false); nav('/login'); }}>Crypto</a>
                <a href="#about" onClick={() => { setMobileMenuOpen(false); }}>About Us</a>
                <a href="#help" onClick={() => { setMobileMenuOpen(false); }}>Help</a>
              </nav>
              <div className="mobile-drawer-actions">
                <button type="button" className="btn-primary-blue full" onClick={() => { setMobileMenuOpen(false); nav('/register'); }}>
                  Open an account <I.ArrowRight size={18} />
                </button>
                <button type="button" className="btn-secondary-dark full" onClick={() => { setMobileMenuOpen(false); nav('/login'); }}>
                  Sign in
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <main className="nexa-main-content">
        <section className="nexa-hero-section">
          <div className="hero-grid">
            {/* HERO LEFT COLUMN */}
            <div className="hero-left">
              <div className="reimagined-badge">
                <span className="green-pulse-dot"></span>
                <span>Global banking, reimagined</span>
              </div>

              <h1 className="hero-title">
                Banking made <br />
                <span className="title-orange">simpler.</span>
              </h1>

              <p className="hero-lead-text">
                A clearer way to manage money, grow savings, and move confidently across borders — all in one secure platform.
              </p>

              {/* Action Buttons */}
              <div className="hero-actions-row">
                <button type="button" className="btn-primary-blue" onClick={() => nav('/register')}>
                  Open an account <I.ArrowRight size={18} />
                </button>
                <button type="button" className="btn-secondary-dark" onClick={() => nav('/login')}>
                  Sign in
                </button>
              </div>

              {/* Customer Rating Section */}
              <div className="customer-trust-row">
                <div className="avatar-stack">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="User 1" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="User 2" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" alt="User 3" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" alt="User 4" />
                </div>
                <div className="trust-details">
                  <p className="trust-count">Join 250,000+ customers worldwide</p>
                  <div className="rating-stars">
                    <strong>4.9/5</strong>
                    <div className="stars-group">
                      {'★'.repeat(5)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HERO RIGHT COLUMN - FLOATING NEXA ACCOUNT CARD */}
            <div className="hero-right">
              <div className="floating-account-card">
                {/* Card Background Dot Matrix Pattern */}
                <div className="card-dot-matrix"></div>

                {/* Card Top Row */}
                <div className="card-top-row">
                  <div className="card-brand-logo">
                    <span className="desktop-logo-text"><Logo /></span>
                    <span className="mobile-card-title">Your NEXA account</span>
                  </div>
                  <button type="button" className="card-bell-icon" onClick={() => nav('/login')} aria-label="Notifications">
                    <I.Bell size={18} />
                  </button>
                </div>

                {/* Balance Info */}
                <div className="card-balance-section">
                  <p className="balance-label">Available balance</p>
                  <h2 className="balance-amount">$ 12,456.78</h2>
                  <div className="growth-indicator-tag">
                    <I.ArrowUpRight size={14} />
                    <span>5.23% this month</span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="card-divider"></div>

                {/* Bottom Actions Row */}
                <div className="card-actions-grid">
                  <button type="button" className="card-action-btn" onClick={() => nav('/login')}>
                    <div className="action-icon-circle"><I.Send size={18} /></div>
                    <span>Send</span>
                  </button>

                  <button type="button" className="card-action-btn" onClick={() => nav('/login')}>
                    <div className="action-icon-circle"><I.Download size={18} /></div>
                    <span>Receive</span>
                  </button>

                  <button type="button" className="card-action-btn" onClick={() => nav('/login')}>
                    <div className="action-icon-circle"><I.CreditCard size={18} /></div>
                    <span>Cards</span>
                  </button>

                  <button type="button" className="card-action-btn" onClick={() => nav('/login')}>
                    <div className="action-icon-circle"><I.MoreHorizontal size={18} /></div>
                    <span>More</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CRYPTO MARKETS TODAY SECTION */}
        <section id="crypto" className="nexa-crypto-section">
          <div className="crypto-card-container">
            <div className="crypto-section-header">
              <h2>Crypto markets today</h2>
              <button type="button" className="view-all-link" onClick={() => nav('/login')}>
                View all <I.ArrowRight size={16} />
              </button>
            </div>

            <div className="crypto-grid">
              {cryptoAssets.map((asset) => (
                <div key={asset.id} className="crypto-item-card" onClick={() => nav('/login')}>
                  <div className="crypto-card-head">
                    {asset.icon}
                    <div className="crypto-info">
                      <h4>{asset.name}</h4>
                      <p className="pair-code">{asset.pair}</p>
                    </div>
                  </div>

                  <div className="crypto-price-row">
                    <span className="price-num">{asset.price}</span>
                    <span className={`change-badge ${asset.id === 'usdt' ? 'neutral' : 'positive'}`}>
                      {asset.change}
                    </span>
                  </div>

                  <div className="crypto-chart-wrapper">
                    <LiveSparkline
                      color={asset.color}
                      gradientId={asset.gradientId}
                      initialValues={asset.values}
                      height={46}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURE CARDS SECTION */}
        <section className="nexa-features-section">
          <div className="features-grid">
            {features.map((item) => {
              const IconComp = item.icon;
              return (
                <div key={item.title} className="feature-card" onClick={() => nav('/register')}>
                  <div className={`feature-icon-wrapper ${item.colorClass}`}>
                    <IconComp size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="nexa-footer-bar">
        <p>NEXA Microfinance Bank — Secure. Simple. Global.</p>
      </footer>
    </div>
  );
}
